const request = require("supertest");
const httpStatus = require("http-status");

const app = require("../../../configs/express");

describe("Unit tests for the rest API", () => {
  describe("GET /api/status", () => {
    it("should be return a message", async () => {
      res = await request(app).get("/api/status");

      expect(res.status).toEqual(httpStatus.OK);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });
  });

  describe("GET /api/register", () => {
    it("should be return register page message", async () => {
      res = await request(app).get("/api/register");

      expect(res.status).toEqual(httpStatus.OK);
      expect(res.body).toEqual({
        success: true,
        message: "You're in REGISTER Page",
      });
    });
  });

  describe("GET /api/login", () => {
    it("should be return login page message", async () => {
      res = await request(app).get("/api/login");

      expect(res.status).toEqual(httpStatus.OK);
      expect(res.body).toEqual({
        success: true,
        message: "Hey there,you're in LOGIN Page",
      });
    });
  });
});
