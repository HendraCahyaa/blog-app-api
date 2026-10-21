import { User } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import argon from "argon2";
import { ApiError } from "../utils/api-error.js";
import jwt from "jsonwebtoken";
import {
  ChangePasswordSchema,
  ForgotPasswordSchema,
  GoogleSchema,
  LoginSchema,
  ResetPasswordSchema,
} from "../validators/auth.validator.js";
import { sendMail } from "../lib/mail.js";
import { getUserServices } from "./user.services.js";
import axios from "axios";

export const registerService = async (
  body: Pick<User, "name" | "email" | "password">,
) => {
  //1. cek email udah kepake atau belum
  const user = await prisma.user.findUnique({
    where: { email: body.email },
  });
  //2.kalo udah kepake throw error
  if (user) {
    throw new ApiError("Email already axist", 400);
  }
  //3.kalo belum hash passwordnya
  const hashedPassword = await argon.hash(body.password);
  //4. create data usernya
  await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: hashedPassword,
    },
  });
  //5. kirim email welcomeing
  await sendMail({
    to: body.email,
    subject: "Welcome to Blog App",
    templateName: "welcome.hbs",
    context: {
      name: body.name,
    },
  });
  //5. return success
  return { message: "register success!" };
};

export const loginService = async (body: LoginSchema) => {
  //1. cek dulu email di db ada atau tidak
  const user = await prisma.user.findUnique({
    where: { email: body.email },
  });
  //2. kalau email tidak ada throw error
  if (!user) {
    throw new ApiError("invalid credentials", 400);
  }
  //3. cek passwordnya ada atau tidak
  const isPassMatch = await argon.verify(user.password, body.password);

  //4. kalo password salah throw error
  if (!isPassMatch) {
    throw new ApiError("invalid credential", 400);
  }

  //5. generate access token (jwt)
  const payload = { id: user.id, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET_REFRESH!, {
    expiresIn: "7d",
  });

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  //6.return message login success : data user + access token
  return {
    message: "Login success",
    accessToken: accessToken,
    refreshToken: refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePic: user.profilePic,
    },
  };
};

export const forgotPasswordService = async (body: ForgotPasswordSchema) => {
  const user = await prisma.user.findUnique({
    where: { email: body.email },
  });

  if (!user) {
    return { message: "Send email success" };
  }
  const payload = { id: user.id, role: user.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET_RESET!, {
    expiresIn: "15m",
  });

  await sendMail({
    to: body.email,
    subject: "Reset password request",
    templateName: "reset-password.hbs",
    context: {
      linkReset: `${process.env.BASE_URL_FE}/reset-password?token=${token}`,
    },
  });
  return { message: "send email success" };
};

export const resetPasswordService = async (
  body: ResetPasswordSchema,
  userId: number,
) => {
  await getUserServices(userId);

  const hashedPassword = await argon.hash(body.password);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
  return { message: "reset password success" };
};
export const googleService = async (body: GoogleSchema) => {
  const response = await axios.get(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: `Bearer ${body.accessToken}`,
      },
    },
  );

  let user = await prisma.user.findUnique({
    where: { email: response.data.email },
  });
  //soft delete
  if (user) {
    if (user?.deleteAt) {
      throw new ApiError("This account has been deleted", 403);
    }

    //kalau emailnya sudah ada dan providernya bukan google,throw error
    if (!!user && user?.provider !== "GOOGLE") {
      throw new ApiError("Please login using credentials", 400);
    }
  }
  //kalau gmailnya belum kepake sama sekali
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: response.data.name,
        email: response.data.email,
        password: "",
        profilePic: response.data.picture,
        provider: "GOOGLE",
      },
    });
  }

  //generated access token
  const payload = { id: user.id, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET_REFRESH!, {
    expiresIn: "7d",
  });

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  //6.return message login success : data user + access token
  return {
    message: "Login success",
    accessToken: accessToken,
    refreshToken: refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePic: user.profilePic,
    },
  };
};

export const changePasswordService = async (
  body: ChangePasswordSchema,
  userId: number,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError("User not found", 404);
  }
  const isPassMatch = await argon.verify(user.password, body.oldPassword);

  if (!isPassMatch) {
    throw new ApiError("Password do not match", 400);
  }
  const newPassword = await argon.hash(body.newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { password: newPassword },
  });
  return { message: "Change password success" };
};
export const refreshService = async (refreshToken?: string) => {
  if (!refreshToken) {
    throw new ApiError("No refresh token", 400);
  }
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: {
      user: true,
    },
  });

  if (!storedToken) {
    throw new ApiError("Refresh token not found", 400);
  }
  if (storedToken.expiredAt < new Date()) {
    throw new ApiError("Refresh token expired", 400);
  }
  const payload = { id: storedToken.user.id, role: storedToken.user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "15m",
  });
  return { accessToken };
};
export const logoutService = async (refreshToken?: string) => {
  if (!refreshToken) {
    throw new ApiError("No refresh token", 400);
  }
  await prisma.refreshToken.delete({
    where: { token: refreshToken },
  });
  return { message: "Logout success" };
};
