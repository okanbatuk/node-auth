const request = require("supertest");
const httpStatus = require("http-status");
const app = require("../../../configs/express");
const { sequelize } = require("../../models");

describe("Integration tests for the auth API", () => {
  let res;
  let invalidUser;
  let dbUser;
  let newUser;

  beforeEach(async () => {
    res = {};
    invalidUser = {
      email: "",
      firstName: "test",
      lastName: "test",
      password: "123123",
    };
    dbUser = {
      email: "ahmet@example.com",
      password: "123456",
      firstName: "Ahmet",
      lastName: "Kinik",
    };
    newUser = {
      email: "test@test.com",
      password: "123123",
      firstName: "test",
      lastName: "test",
    };
  });

  afterAll(async () => {
    await sequelize.close();
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
        .send(dbUser);

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
        data: expect.any(Object),
      });
    });
  });
});
