import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "../../../generated/prisma/enums.js";
import argon from "argon2";
import jwt from "jsonwebtoken";
import { prisma } from "../../../src/lib/prisma.js";
import { app } from "../../../src/app.js";
import { sendMail } from "../../../src/lib/mail.js";
import request from "supertest";

vi.mock("../../../src/lib/mail.js", () => ({
  sendMail: vi.fn().mockResolvedValue(undefined),
}));

const sendMailMock = vi.mocked(sendMail);

const defaultPassword = "Admin123!";
const newPassword = "NewAdmin123!";

type UserData = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

const createUser = async (overrides: Partial<UserData> = {}) => {
  const data: UserData = {
    name: "test",
    email: "test@gmail.com",
    password: defaultPassword,
    role: UserRole.USER,
    ...overrides,
  };
  const hashedPassword = await argon.hash(data.password);

  return prisma.user.create({
    data: { ...data, password: hashedPassword },
  });
};

const getLastMail = () => {
  const calls = sendMailMock.mock.calls;
  const lastCall = calls[calls.length - 1];

  return lastCall[0] as {
    to: string;
    subject: string;
    templateName: string;
    context: { linkReset: string };
  };
};

const getResetTokenFromMail = () => {
  const link = getLastMail().context.linkReset;
  const token = new URL(link).searchParams.get("token");

  if (!token) {
    throw new Error("Reset token was not found in the email link");
  }

  return token;
};

const requestResetToken = async (email: string) => {
  await request(app).post("/auth/forgot-password").send({ email });
  return getResetTokenFromMail();
};

const createUserWithResetToken = async () => {
  const user = await createUser();
  const token = await requestResetToken(user.email);

  return { user, token };
};

const resetPasswordRequest = (token: string, body: object) =>
  request(app)
    .post("/auth/reset-password")
    .set("Cookie", `accessToken=${token}`)
    .send(body);

beforeEach(() => {
  sendMailMock.mockClear();
});

describe("POST /auth/forgot-password", () => {
  it("should send a reset password email when the email is registered", async () => {
    //arrange
    const user = await createUser();

    //action
    const response = await request(app)
      .post("/auth/forgot-password")
      .send({ email: user.email });

    //assert
    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/send email success/i);
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: user.email,
        subject: "Reset password request",
        templateName: "reset-password.hbs",
      }),
    );
  });

  it("should include a reset link to the frontend in the email", async () => {
    //arrange
    const user = await createUser();

    //action
    await request(app)
      .post("/auth/forgot-password")
      .send({ email: user.email });

    //assert
    const { context } = getLastMail();
    expect(context.linkReset).toContain(
      `${process.env.BASE_URL_FE}/reset-password?token=`,
    );
    expect(new URL(context.linkReset).searchParams.get("token")).toBeTruthy();
  });

  it("should include a valid reset token in the email link", async () => {
    //arrange
    const user = await createUser();

    //action
    await request(app)
      .post("/auth/forgot-password")
      .send({ email: user.email });

    //assert
    const token = getResetTokenFromMail();
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET_RESET!,
    ) as jwt.JwtPayload;
    expect(payload.id).toBe(user.id);
    expect(payload.role).toBe(user.role);
  });

  it("should create a reset token that expires in 15 minutes", async () => {
    //arrange
    const user = await createUser();

    //action
    await request(app)
      .post("/auth/forgot-password")
      .send({ email: user.email });

    //assert
    const payload = jwt.verify(
      getResetTokenFromMail(),
      process.env.JWT_SECRET_RESET!,
    ) as jwt.JwtPayload;
    expect(payload.exp! - payload.iat!).toBe(15 * 60);
  });

  it("should not send an email when the email is not registered", async () => {
    //action
    const response = await request(app)
      .post("/auth/forgot-password")
      .send({ email: "notexist@gmail.com" });

    //assert
    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/send email success/i);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("should return the same response whether the email is registered or not", async () => {
    //arrange
    const user = await createUser();

    //action
    const registeredResponse = await request(app)
      .post("/auth/forgot-password")
      .send({ email: user.email });
    const unknownResponse = await request(app)
      .post("/auth/forgot-password")
      .send({ email: "notexist@gmail.com" });

    //assert
    expect(registeredResponse.status).toBe(200);
    expect(unknownResponse.status).toBe(200);
    expect(registeredResponse.body.message.toLowerCase()).toBe(
      unknownResponse.body.message.toLowerCase(),
    );
  });

  it("should return error when email format is invalid", async () => {
    //action
    const response = await request(app)
      .post("/auth/forgot-password")
      .send({ email: "Invalid email format" });

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("email : Invalid email address");
  });

  it("should return error when email is missing", async () => {
    //action
    const response = await request(app).post("/auth/forgot-password").send({});

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toContain("email");
  });

  it("should not send an email when validation fails", async () => {
    //action
    const response = await request(app)
      .post("/auth/forgot-password")
      .send({ email: "Invalid email format" });

    //assert
    expect(response.status).toBe(404);
    expect(sendMailMock).not.toHaveBeenCalled();
  });
});

describe("POST /auth/reset-password", () => {
  it("should reset the password successfully using the token from the email", async () => {
    //arrange
    const { token } = await createUserWithResetToken();

    //action
    const response = await resetPasswordRequest(token, {
      password: newPassword,
    });

    //assert
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("reset password success");
  });

  it("should not return the new password in the response", async () => {
    //arrange
    const { token } = await createUserWithResetToken();

    //action
    const response = await resetPasswordRequest(token, {
      password: newPassword,
    });

    //assert
    expect(response.status).toBe(200);
    expect(response.body).not.toHaveProperty("password");
    expect(JSON.stringify(response.body)).not.toContain(newPassword);
  });

  it("should hash and save the new password to the database", async () => {
    //arrange
    const { user, token } = await createUserWithResetToken();

    //action
    const response = await resetPasswordRequest(token, {
      password: newPassword,
    });

    //assert
    expect(response.status).toBe(200);
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    expect(updatedUser?.password).not.toBe(newPassword);
    expect(await argon.verify(updatedUser!.password, newPassword)).toBe(true);
  });

  it("should allow login with the new password", async () => {
    //arrange
    const { user, token } = await createUserWithResetToken();
    await resetPasswordRequest(token, { password: newPassword });

    //action
    const response = await request(app).post("/auth/login").send({
      email: user.email,
      password: newPassword,
    });

    //assert
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login success");
    expect(response.body.user.id).toBe(user.id);
  });

  it("should not allow login with the old password", async () => {
    //arrange
    const { user, token } = await createUserWithResetToken();
    await resetPasswordRequest(token, { password: newPassword });

    //action
    const response = await request(app).post("/auth/login").send({
      email: user.email,
      password: defaultPassword,
    });

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Invalid credentials");
  });

  it("should not change another user's password", async () => {
    //arrange
    const firstUser = await createUser({
      name: "first",
      email: "first@gmail.com",
    });
    const secondUser = await createUser({
      name: "second",
      email: "second@gmail.com",
    });
    const token = await requestResetToken(firstUser.email);

    //action
    const response = await resetPasswordRequest(token, {
      password: newPassword,
    });

    //assert
    expect(response.status).toBe(200);
    const updatedSecondUser = await prisma.user.findUnique({
      where: { id: secondUser.id },
    });
    expect(
      await argon.verify(updatedSecondUser!.password, defaultPassword),
    ).toBe(true);
    expect(await argon.verify(updatedSecondUser!.password, newPassword)).toBe(
      false,
    );
  });

  it("should return error when token is missing", async () => {
    //action
    const response = await request(app)
      .post("/auth/reset-password")
      .send({ password: newPassword });

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("No token provided");
  });

  it("should return error when token is invalid", async () => {
    //action
    const response = await resetPasswordRequest("invalid.token.value", {
      password: newPassword,
    });

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Token invalid");
  });

  it("should return error when token is expired", async () => {
    //arrange
    const user = await createUser();
    const expiredToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET_RESET!,
      { expiresIn: -10 },
    );

    //action
    const response = await resetPasswordRequest(expiredToken, {
      password: newPassword,
    });

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Token expired");
  });

  it("should return error when token is signed with a different secret", async () => {
    //arrange
    const user = await createUser();
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" },
    );

    //action
    const response = await resetPasswordRequest(accessToken, {
      password: newPassword,
    });

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Token invalid");
  });

  it("should return error when the user in the token no longer exists", async () => {
    //arrange
    const token = jwt.sign(
      { id: 999999, role: UserRole.USER },
      process.env.JWT_SECRET_RESET!,
      { expiresIn: "15m" },
    );

    //action
    const response = await resetPasswordRequest(token, {
      password: newPassword,
    });

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User not found");
  });

  it("should return error when password is missing", async () => {
    //arrange
    const { token } = await createUserWithResetToken();

    //action
    const response = await resetPasswordRequest(token, {});

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toContain("password");
  });

  it("should return error when password is less than 6 characters", async () => {
    //arrange
    const { token } = await createUserWithResetToken();

    //action
    const response = await resetPasswordRequest(token, { password: "Ad1!" });

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toContain(
      "Passowrd must be at least 6 character",
    );
  });

  it("should return error when password has no uppercase letter", async () => {
    //arrange
    const { token } = await createUserWithResetToken();

    //action
    const response = await resetPasswordRequest(token, {
      password: "admin123!",
    });

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toContain(
      "Must contain at least one uppercase letter",
    );
  });

  it("should return error when password has no lowercase letter", async () => {
    //arrange
    const { token } = await createUserWithResetToken();

    //action
    const response = await resetPasswordRequest(token, {
      password: "ADMIN123!",
    });

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toContain(
      "Must contain at least one lowercase letter",
    );
  });

  it("should return error when password has no number", async () => {
    //arrange
    const { token } = await createUserWithResetToken();

    //action
    const response = await resetPasswordRequest(token, {
      password: "Admin!!!",
    });

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toContain("Must contain at least one number");
  });

  it("should not update the password when validation fails", async () => {
    //arrange
    const { user, token } = await createUserWithResetToken();
    const userBeforeReset = await prisma.user.findUnique({
      where: { id: user.id },
    });

    //action
    const response = await resetPasswordRequest(token, { password: "Ad1!" });

    //assert
    expect(response.status).toBe(404);
    const userAfterReset = await prisma.user.findUnique({
      where: { id: user.id },
    });
    expect(userAfterReset?.password).toBe(userBeforeReset?.password);
    expect(await argon.verify(userAfterReset!.password, defaultPassword)).toBe(
      true,
    );
  });
});
