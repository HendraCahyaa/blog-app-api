import { describe, expect, it } from "vitest";
import { Provider, UserRole } from "../../../generated/prisma/enums.js";
import argon from "argon2";
import jwt from "jsonwebtoken";
import { prisma } from "../../../src/lib/prisma.js";
import { app } from "../../../src/app.js";
import request from "supertest";

describe("POST /auth/login", () => {
  it("should login successfully", async () => {
    //arrange
    const data = {
      name: "test",
      email: "test@gmail.com",
      password: "Admin123!",
      role: UserRole.USER,
      provider: Provider.CREDENTIALS,
    };
    const hashedPassword = await argon.hash(data.password);
    await prisma.user.create({
      data: { ...data, password: hashedPassword },
    });

    //action
    const response = await request(app).post("/auth/login").send({
      email: data.email,
      password: data.password,
    });

    //assert
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login success");
    expect(response.body.user.id).toBeDefined();
  });

  it("should return error when email does not exist", async () => {
    //action
    const response = await request(app).post("/auth/login").send({
      email: "notexist@mail.com",
      password: "Admin123!",
    });
    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Invalid credentials");
  });
  it("should return error when password is wrong", async () => {
    //arrange
    const data = {
      name: "test",
      email: "test@gmail.com",
      password: "Admin123!",
      role: UserRole.USER,
      provider: Provider.CREDENTIALS,
    };
    const hashedPassword = await argon.hash(data.password);
    await prisma.user.create({
      data: { ...data, password: hashedPassword },
    });

    //action
    const response = await request(app).post("/auth/login").send({
      email: data.email,
      password: "WrongPassword123!",
    });

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Invalid credentials");
  });
  it("should return error when email format is invalid", async () => {
    //action
    const response = await request(app).post("/auth/login").send({
      email: "Invalid email format",
      password: "Admin123!",
    });
    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("email : Invalid email address");
  });

  it("should return user data without password and valid tokens", async () => {
    //arrange
    const data = {
      name: "test",
      email: "test@gmail.com",
      password: "Admin123!",
      role: UserRole.USER,
      provider: Provider.CREDENTIALS,
    };
    const hashedPassword = await argon.hash(data.password);
    const user = await prisma.user.create({
      data: { ...data, password: hashedPassword },
    });

    //action
    const response = await request(app).post("/auth/login").send({
      email: data.email,
      password: data.password,
    });

    //assert
    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.accessToken).not.toBe(response.body.refreshToken);
    expect(response.body.user).toMatchObject({
      id: user.id,
      name: data.name,
      email: data.email,
      role: data.role,
      profilePic: null,
    });
    expect(response.body.user).not.toHaveProperty("password");
  });

  it("should include user id and role in the access token", async () => {
    //arrange
    const data = {
      name: "test",
      email: "test@gmail.com",
      password: "Admin123!",
      role: UserRole.ADMIN,
      provider: Provider.CREDENTIALS,
    };
    const hashedPassword = await argon.hash(data.password);
    const user = await prisma.user.create({
      data: { ...data, password: hashedPassword },
    });

    //action
    const response = await request(app).post("/auth/login").send({
      email: data.email,
      password: data.password,
    });

    //assert
    expect(response.status).toBe(200);
    const payload = jwt.verify(
      response.body.accessToken,
      process.env.JWT_SECRET!,
    ) as jwt.JwtPayload;
    expect(payload.id).toBe(user.id);
    expect(payload.role).toBe(data.role);
  });

  it("should set accessToken and refreshToken cookies", async () => {
    //arrange
    const data = {
      name: "test",
      email: "test@gmail.com",
      password: "Admin123!",
      role: UserRole.USER,
      provider: Provider.CREDENTIALS,
    };
    const hashedPassword = await argon.hash(data.password);
    await prisma.user.create({
      data: { ...data, password: hashedPassword },
    });

    //action
    const response = await request(app).post("/auth/login").send({
      email: data.email,
      password: data.password,
    });

    //assert
    expect(response.status).toBe(200);
    const cookies = response.headers["set-cookie"] as unknown as string[];
    const cookieNames = cookies.map((cookie) => cookie.split("=")[0]);
    expect(cookieNames).toContain("accessToken");
    expect(cookieNames).toContain("refreshToken");
    expect(
      cookies.find((cookie) => cookie.startsWith("accessToken=")),
    ).toContain(response.body.accessToken);
    expect(
      cookies.find((cookie) => cookie.startsWith("refreshToken=")),
    ).toContain(response.body.refreshToken);
  });

  it("should save refresh token to database", async () => {
    //arrange
    const data = {
      name: "test",
      email: "test@gmail.com",
      password: "Admin123!",
      role: UserRole.USER,
      provider: Provider.CREDENTIALS,
    };
    const hashedPassword = await argon.hash(data.password);
    const user = await prisma.user.create({
      data: { ...data, password: hashedPassword },
    });

    //action
    const response = await request(app).post("/auth/login").send({
      email: data.email,
      password: data.password,
    });

    //assert
    expect(response.status).toBe(200);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: response.body.refreshToken },
    });
    expect(storedToken).not.toBeNull();
    expect(storedToken?.userId).toBe(user.id);
    expect(storedToken!.expiredAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("should create a new refresh token record on every login", async () => {
    //arrange
    const data = {
      name: "test",
      email: "test@gmail.com",
      password: "Admin123!",
      role: UserRole.USER,
      provider: Provider.CREDENTIALS,
    };
    const hashedPassword = await argon.hash(data.password);
    const user = await prisma.user.create({
      data: { ...data, password: hashedPassword },
    });

    //action
    await request(app)
      .post("/auth/login")
      .send({ email: data.email, password: data.password });
    const secondResponse = await request(app)
      .post("/auth/login")
      .send({ email: data.email, password: data.password });

    //assert
    expect(secondResponse.status).toBe(404);
    const refreshTokens = await prisma.refreshToken.findMany({
      where: { userId: user.id },
    });
    expect(refreshTokens).toHaveLength(1);
  });

  it("should return error when email is missing", async () => {
    //action
    const response = await request(app).post("/auth/login").send({
      password: "Admin123!",
    });

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toContain("email");
  });

  it("should return error when password is missing", async () => {
    //action
    const response = await request(app).post("/auth/login").send({
      email: "test@gmail.com",
    });

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toContain("password");
  });

  it("should return error when password is empty", async () => {
    //action
    const response = await request(app).post("/auth/login").send({
      email: "test@gmail.com",
      password: "",
    });

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toContain("password");
  });
});
