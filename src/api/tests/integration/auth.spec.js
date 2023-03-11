const request = require("supertest");
const httpStatus = require("http-status");
const app = require("../../../configs/express");
const { sequelize, user: User } = require("../../models");
const redisClient = require("../../../configs/redis.con");

describe("Integration tests for the auth API", () => {
  let res;
  let dbUser;
  let invalidUser;
  let existUser;
  let newUser;

  beforeEach(async () => {
    res = {};
    dbUser = {
      uuid: "ee7c6b76-61a1-461f-8391-447531bf5078",
      firstName: "test",
      lastName: "test",
      email: "test@example.com",
      password: "$2b$10$uy0WLQMHw6YtXCIzvGKqiuz/43hBxBM5ODR.Wi4.KSugjUwD2IJQ6",
      refreshToken: [],
      created_at: new Date(),
      updated_at: new Date(),
    };
    invalidUser = {
      email: "",
      firstName: "test",
      lastName: "test",
      password: "123123",
    };
    existUser = {
      firstName: "test",
      lastName: "test",
      email: "test@example.com",
      password: "A!1234",
    };
    newUser = {
      email: "admin@example.com",
      password: "Admin!123321",
      firstName: "admin",
      lastName: "admin",
    };

    // destroy the user table and db in redis
    await redisClient.flushDb();
    await User.destroy({ truncate: true });

    // create one user
    await User.create(dbUser);
  });

  afterAll(async () => {
    // destroy the user table and close the con of postgres
    await User.destroy({ truncate: true });
    await sequelize.close();

    // destroy the db in redis and close the con
    await redisClient.flushDb();
    await redisClient.quit();
  });

  describe("GET /", () => {
    it("should be page not found when a request is made to a route that does not exist", async () => {
      res = await request(app).get("/").set("Accept", "application/json");

      expect(res.status).toEqual(httpStatus.NOT_FOUND);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: expect.any(String),
          status: httpStatus.NOT_FOUND,
        })
      );
    });
  });

  describe("POST /api/register", () => {
    it("should be validation error when submt invalid post body", async () => {
      res = await request(app).post("/api/register").send(invalidUser);

      expect(res.status).toEqual(httpStatus.BAD_REQUEST);
      expect(res.body).toEqual({
        success: false,
        message: "ValidationError",
        status: 400,
      });
    });

    it("should be registration failed when submit a user already registered in db", async () => {
      res = await request(app)
        .post("/api/register")
        .set("Content-type", "application/json")
        .send(existUser);

      expect(res.status).toEqual(httpStatus.CONFLICT);
      expect(res.body).toEqual({
        success: false,
        message: "This email has already been used",
        status: httpStatus.CONFLICT,
      });
    });

    it("should be registration successfully when submit a new user", async () => {
      res = await request(app)
        .post("/api/register")
        .set("Content-Type", "application/json")
        .send(newUser);

      expect(res.status).toEqual(httpStatus.CREATED);
      expect(res.body).toEqual({
        success: true,
        message: expect.any(String),
      });
    });
  });

  describe("POST /api/login", () => {
    it("should be validation error when submt invalid post body", async () => {
      delete invalidUser.firstName;
      delete invalidUser.lastName;
      res = await request(app).post("/api/login").send(invalidUser);

      expect(res.status).toEqual(httpStatus.BAD_REQUEST);
      expect(res.body).toEqual({
        success: false,
        message: "ValidationError",
        status: httpStatus.BAD_REQUEST,
      });
    });

    it("should be Not Found if user does not exist in db ", async () => {
      delete newUser.firstName;
      delete newUser.lastName;
      res = await request(app).post("/api/login").send(newUser);

      expect(res.status).toEqual(httpStatus.NOT_FOUND);
      expect(res.body).toEqual({
        success: false,
        message: expect.any(String),
        status: httpStatus.NOT_FOUND,
      });
    });

    it("should be returned Access token and refresh token in headers when login is successful", async () => {
      delete existUser.firstName;
      delete existUser.lastName;
      res = await request(app).post("/api/login").send(existUser);

      let setCookie = res.header["set-cookie"] !== undefined;
      expect(setCookie).toBe(true);
      expect(res.status).toEqual(httpStatus.OK);
      expect(res.body).toEqual({
        data: { uuid: expect.any(String), accessToken: expect.any(String) },
        success: true,
      });

      let check = await redisClient.exists(dbUser.uuid);
      expect(check).toBeGreaterThan(0);
    });
  });

  describe("GET /api/refresh/:uuid", () => {
    it("should be returned unauthorized status with message if req.cookie does not exist", async () => {
      res = await request(app).get(
        "/api/refresh/ee7c6b76-61a1-461f-8391-447531bf5078"
      );

      expect(res.status).toEqual(httpStatus.UNAUTHORIZED);
      expect(res.body).toEqual({
        success: false,
        message: "Cookie was not provided",
        status: httpStatus.UNAUTHORIZED,
      });
    });
  });

  describe("GET /api/logout", () => {
    it("should be returned no content status if req.cookie does not exist", async () => {
      res = await request(app).get("/api/logout");

      expect(res.status).toEqual(httpStatus.NO_CONTENT);
    });
  });
});
