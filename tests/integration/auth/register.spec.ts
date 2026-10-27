import { describe, expect, it, vi } from "vitest";
import { Provider, UserRole } from "../../../generated/prisma/enums.js";
import argon from "argon2";
import { prisma } from "../../../src/lib/prisma.js";
import { app } from "../../../src/app.js";
import request from "supertest";

vi.mock("../../../src/lib/mail.js", () => ({
  sendMail: vi.fn().mockResolvedValue(undefined),
}));

describe("POST /auth/register", () => {
  it("should register successfully", async () => {
    //arrange
    const data = {
      name: "test",
      email: "test@gmail.com",
      password: "Admin123!",
    };

    //action
    const response = await request(app).post("/auth/register").send(data);

    //assert
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("register success!");
    expect(response.body).not.toHaveProperty("password");
  });

  it("should save the new user to database", async () => {
    //arrange
    const data = {
      name: "test",
      email: "test@gmail.com",
      password: "Admin123!",
    };

    //action
    const response = await request(app).post("/auth/register").send(data);

    //assert
    expect(response.status).toBe(200);
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    expect(user).not.toBeNull();
    expect(user?.name).toBe(data.name);
    expect(user?.email).toBe(data.email);
    expect(user?.role).toBe(UserRole.USER);
    expect(user?.provider).toBe(Provider.CREDENTIALS);
    expect(user?.profilePic).toBeNull();
  });

  it("should hash the password before saving it", async () => {
    //arrange
    const data = {
      name: "test",
      email: "test@gmail.com",
      password: "Admin123!",
    };

    //action
    const response = await request(app).post("/auth/register").send(data);

    //assert
    expect(response.status).toBe(200);
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    expect(user?.password).not.toBe(data.password);
    expect(await argon.verify(user!.password, data.password)).toBe(true);
  });

  it("should not return the password in the response", async () => {
    //arrange
    const data = {
      name: "test",
      email: "test@gmail.com",
      password: "Admin123!",
    };

    //action
    const response = await request(app).post("/auth/register").send(data);

    //assert
    expect(response.status).toBe(200);
    expect(JSON.stringify(response.body)).not.toContain(data.password);
    expect(response.body).not.toHaveProperty("user");
  });

  it("should allow the registered user to login", async () => {
    //arrange
    const data = {
      name: "test",
      email: "test@gmail.com",
      password: "Admin123!",
    };
    await request(app).post("/auth/register").send(data);

    //action
    const response = await request(app).post("/auth/login").send({
      email: data.email,
      password: data.password,
    });

    //assert
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login success");
    expect(response.body.user.email).toBe(data.email);
  });

  it("should return error when email already exists", async () => {
    //arrange
    const data = {
      name: "test",
      email: "test@gmail.com",
      password: "Admin123!",
    };
    await request(app).post("/auth/register").send(data);

    //action
    const response = await request(app)
      .post("/auth/register")
      .send({ ...data, name: "another test" });

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Email already axist");
  });

  it("should not create a duplicate user when email already exists", async () => {
    //arrange
    const data = {
      name: "test",
      email: "test@gmail.com",
      password: "Admin123!",
    };
    await request(app).post("/auth/register").send(data);
    await request(app)
      .post("/auth/register")
      .send({
        ...data,
        name: "another test",
        password: "Another123!",
      });

    //action
    const users = await prisma.user.findMany({
      where: { email: data.email },
    });

    //assert
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe(data.name);
  });

  it("should return error when email format is invalid", async () => {
    //action
    const response = await request(app).post("/auth/register").send({
      name: "test",
      email: "Invalid email format",
      password: "Admin123!",
    });

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("email : Invalid email address");
  });

  it("should return error when email is missing", async () => {
    //action
    const response = await request(app).post("/auth/register").send({
      name: "test",
      password: "Admin123!",
    });

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toContain("email");
  });

  it("should return error when name is missing", async () => {
    //action
    const response = await request(app).post("/auth/register").send({
      email: "test@gmail.com",
      password: "Admin123!",
    });

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toContain("name");
  });

  it("should return error when name is less than 3 characters", async () => {
    //action
    const response = await request(app).post("/auth/register").send({
      name: "ab",
      email: "test@gmail.com",
      password: "Admin123!",
    });

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toContain("name");
  });

  it("should return error when password is missing", async () => {
    //action
    const response = await request(app).post("/auth/register").send({
      name: "test",
      email: "test@gmail.com",
    });

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toContain("password");
  });

  it("should return error when password is less than 6 characters", async () => {
    //action
    const response = await request(app).post("/auth/register").send({
      name: "test",
      email: "test@gmail.com",
      password: "Ad1!",
    });

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toContain(
      "Passowrd must be at least 6 character",
    );
  });

  it("should return error when password has no uppercase letter", async () => {
    //action
    const response = await request(app).post("/auth/register").send({
      name: "test",
      email: "test@gmail.com",
      password: "admin123!",
    });

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toContain(
      "Must contain at least one uppercase letter",
    );
  });

  it("should return error when password has no lowercase letter", async () => {
    //action
    const response = await request(app).post("/auth/register").send({
      name: "test",
      email: "test@gmail.com",
      password: "ADMIN123!",
    });

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toContain(
      "Must contain at least one lowercase letter",
    );
  });

  it("should return error when password has no number", async () => {
    //action
    const response = await request(app).post("/auth/register").send({
      name: "test",
      email: "test@gmail.com",
      password: "Admin!!!",
    });

    //assert
    expect(response.status).toBe(404);
    expect(response.body.message).toContain("Must contain at least one number");
  });

  it("should not create a user when validation fails", async () => {
    //action
    const response = await request(app).post("/auth/register").send({
      name: "test",
      email: "Invalid email format",
      password: "Admin123!",
    });

    //assert
    expect(response.status).toBe(404);
    const user = await prisma.user.findFirst();
    expect(user).toBeNull();
  });
});
