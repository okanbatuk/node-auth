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
});
