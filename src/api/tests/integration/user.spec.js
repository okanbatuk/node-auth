const request = require("supertest");
const httpStatus = require("http-status");
const app = require("../../../configs/express");
const { sequelize, user: User } = require("../../models");

describe("Integration tests for user api", () => {
  let res;
  let dbUser;
  let otherUser;
  let existUser;
  let accessToken;
  let anotherUuid;

  beforeEach(async () => {
    res = {};

    anotherUuid = "52b8bdc5-b94f-4d2b-b7c5-db2c140f9bc1";

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

    otherUser = {
      uuid: "1cd0f44e-d43b-481c-88fb-93275b2f4591",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "$2b$10$uy0WLQMHw6YtXCIzvGKqiuz/43hBxBM5ODR.Wi4.KSugjUwD2IJQ6",
      refreshToken: [],
      created_at: new Date(),
      updated_at: new Date(),
    };

    existUser = {
      firstName: "test",
      lastName: "test",
      email: "test@example.com",
      password: "A!1234",
    };

    await User.destroy({ truncate: true });
    await User.create(dbUser);
    await User.create(otherUser);

    res = await getToken(existUser);

    accessToken = res.body.data.accessToken;
  });

  afterAll(async () => {
    await User.destroy({ truncate: true });
    await sequelize.close();
  });

  describe("GET /api/users", () => {
    it("should be returned error when sending request without token", async () => {
      res = await request(app).get("/api/users");

      expect(res.status).toEqual(httpStatus.BAD_REQUEST);
      expect(res.body).toEqual({
        success: false,
        status: httpStatus.BAD_REQUEST,
        message: "Token was not provided",
      });
    });

    it("should be returned all users", async () => {
      res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toEqual(httpStatus.OK);
      expect(res.body).toEqual({
        success: true,
        data: {
          count: expect.any(Number),
          users: expect.any(Array),
        },
      });
    });
  });

  describe("GET /api/users/:uuid", () => {
    it("should be returned error when sending request without token", async () => {
      res = await request(app).get("/api/users");

      expect(res.status).toEqual(httpStatus.BAD_REQUEST);
      expect(res.body).toEqual({
        success: false,
        status: httpStatus.BAD_REQUEST,
        message: "Token was not provided",
      });
    });

    it("should be returned a user according to uuid", async () => {
      res = await request(app)
        .get(`/api/users/${dbUser.uuid}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toEqual(httpStatus.OK);
      expect(res.body).toEqual({
        success: true,
        data: {
          users: expect.any(Array),
        },
      });
    });

    it("should be Not Found when user was not found", async () => {
      res = await request(app)
        .get(`/api/users/${anotherUuid}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toEqual(httpStatus.NOT_FOUND);
      expect(res.body).toEqual({
        success: false,
        message: expect.any(String),
        status: httpStatus.NOT_FOUND,
      });
    });

    it("should be Validation Error when sending invalid uuid", async () => {
      res = await request(app)
        .get(`/api/users/eefss-a`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toEqual(httpStatus.BAD_REQUEST);
      expect(res.body).toEqual({
        success: false,
        message: "ValidationError",
        status: httpStatus.BAD_REQUEST,
      });
    });
  });

  describe("POST /api/users/:uuid", () => {
    it("should be returned error when sending request without token", async () => {
      res = await request(app).get("/api/users");

      expect(res.status).toEqual(httpStatus.BAD_REQUEST);
      expect(res.body).toEqual({
        success: false,
        status: httpStatus.BAD_REQUEST,
        message: "Token was not provided",
      });
    });

    it("should be Validation Error when sending invalid uuid", async () => {
      res = await request(app)
        .post(`/api/users/eefss-a`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toEqual(httpStatus.BAD_REQUEST);
      expect(res.body).toEqual({
        success: false,
        message: "ValidationError",
        status: httpStatus.BAD_REQUEST,
      });
    });

    it("should be Not Found when sending uuid not found in db", async () => {
      res = await request(app)
        .post(`/api/users/${anotherUuid}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ firstName: "John", lastName: "Doe" });

      expect(res.status).toEqual(httpStatus.NOT_FOUND);
      expect(res.body).toEqual({
        success: false,
        message: "User Not Found",
        status: httpStatus.NOT_FOUND,
      });
    });

    it("should be updated successfully if correct uuid with firstName and lastName sent", async () => {
      res = await request(app)
        .post(`/api/users/${dbUser.uuid}`)
        .set("content-type", "application/json")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ firstName: "John", lastName: "Doe" });

      let checkFields = await request(app)
        .get(`/api/users/${dbUser.uuid}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toEqual(httpStatus.OK);
      expect(res.body).toEqual({
        success: true,
        message: expect.any(String),
      });
      expect(checkFields.body.data.users[0].firstName).toEqual("John");
      expect(checkFields.body.data.users[0].lastName).toEqual("Doe");
    });

    it("should be updated successfully if correct uuid with firstName sent", async () => {
      res = await request(app)
        .post(`/api/users/${dbUser.uuid}`)
        .set("content-type", "application/json")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ firstName: "John" });

      let checkFields = await request(app)
        .get(`/api/users/${dbUser.uuid}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toEqual(httpStatus.OK);
      expect(res.body).toEqual({
        success: true,
        message: expect.any(String),
      });
      expect(checkFields.body.data.users[0].firstName).toEqual("John");
      expect(checkFields.body.data.users[0].lastName).toEqual(dbUser.lastName);
    });

    it("should be updated successfully if correct uuid with lastName sent", async () => {
      res = await request(app)
        .post(`/api/users/${dbUser.uuid}`)
        .set("content-type", "application/json")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ lastName: "Doe" });

      let checkFields = await request(app)
        .get(`/api/users/${dbUser.uuid}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toEqual(httpStatus.OK);
      expect(res.body).toEqual({
        success: true,
        message: expect.any(String),
      });
      expect(checkFields.body.data.users[0].firstName).toEqual(
        dbUser.firstName
      );
      expect(checkFields.body.data.users[0].lastName).toEqual("Doe");
    });

    it("should be failed -- CONFLICT -- if an email found in db is sent  ", async () => {
      res = await request(app)
        .post(`/api/users/${dbUser.uuid}`)
        .set("content-type", "application/json")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ email: "john@example.com" });

      expect(res.status).toEqual(httpStatus.CONFLICT);
      expect(res.body).toEqual({
        success: false,
        message: "Email has already been used",
        status: httpStatus.CONFLICT,
      });
    });

    it("should be updated successfully if correct uuid with an email not found in db sent", async () => {
      res = await request(app)
        .post(`/api/users/${dbUser.uuid}`)
        .set("content-type", "application/json")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ email: "jane@example.com" });

      let checkFields = await request(app)
        .get(`/api/users/${dbUser.uuid}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toEqual(httpStatus.OK);
      expect(res.body).toEqual({
        success: true,
        message: expect.any(String),
      });
      expect(checkFields.body.data.users[0].email).toEqual("jane@example.com");
    });
  });

  describe("POST /api/users/update-password/:uuid", () => {
    it("should be Validation Error when sending invalid uuid", async () => {
      res = await request(app)
        .post(`/api/users/update-password/eefss-a`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toEqual(httpStatus.BAD_REQUEST);
      expect(res.body).toEqual({
        success: false,
        message: "ValidationError",
        status: httpStatus.BAD_REQUEST,
      });
    });

    it("should be Validation Error when sending invalid request body", async () => {
      res = await request(app)
        .post(`/api/users/update-password/${dbUser.uuid}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toEqual(httpStatus.BAD_REQUEST);
      expect(res.body).toEqual({
        success: false,
        message: "ValidationError",
        status: httpStatus.BAD_REQUEST,
      });
    });

    it("should be Forbidden if incorrect password is sent ", async () => {
      res = await request(app)
        .post(`/api/users/update-password/${dbUser.uuid}`)
        .set("Content-type", "application/json")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ password: "A!12345", newPassword: "Admin!.123321" });

      expect(res.status).toEqual(httpStatus.FORBIDDEN);
      expect(res.body).toEqual({
        success: false,
        message: "Password was not matched",
        status: httpStatus.FORBIDDEN,
      });
    });

    it("should be successfully updated when correct password and new password", async () => {
      delete existUser.firstName;
      delete existUser.lastName;

      res = await request(app)
        .post(`/api/users/update-password/${dbUser.uuid}`)
        .set("Content-type", "application/json")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ password: "A!1234", newPassword: "Admin!.123321" });

      let oldPassLogin = await request(app)
        .post("/api/login")
        .set("Content-type", "application/json")
        .send(existUser);

      let newPassLogin = await request(app)
        .post("/api/login")
        .set("Content-type", "application/json")
        .send({ email: existUser.email, password: "Admin!.123321" });

      expect(res.status).toEqual(httpStatus.OK);
      expect(res.body).toEqual({
        success: true,
        message: "User password successfully updated",
      });

      expect(oldPassLogin.status).toEqual(httpStatus.UNAUTHORIZED);
      expect(oldPassLogin.body).toEqual({
        success: false,
        message: "Email or password incorrect",
        status: httpStatus.UNAUTHORIZED,
      });

      expect(newPassLogin.status).toEqual(httpStatus.OK);
      expect(newPassLogin.body).toEqual({
        data: { accessToken: expect.any(String) },
        success: true,
      });
    });
  });

  describe("DELETE /api/users/:uuid", () => {
    it("should be Validation Error when sending invalid uuid", async () => {
      res = await request(app)
        .delete(`/api/users/eefss-a`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toEqual(httpStatus.BAD_REQUEST);
      expect(res.body).toEqual({
        success: false,
        message: "ValidationError",
        status: httpStatus.BAD_REQUEST,
      });
    });

    it("should be Not Found when sending uuid not found in db", async () => {
      res = await request(app)
        .delete(`/api/users/${anotherUuid}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ firstName: "John", lastName: "Doe" });

      expect(res.status).toEqual(httpStatus.NOT_FOUND);
      expect(res.body).toEqual({
        success: false,
        message: "User Not Found",
        status: httpStatus.NOT_FOUND,
      });
    });

    it("should be successfully deleted", async () => {
      res = await request(app)
        .delete(`/api/users/${dbUser.uuid}`)
        .set("Authorization", `Bearer ${accessToken}`);

      delete existUser.firstName;
      delete existUser.lastName;
      let failedLogin = await request(app)
        .post("/api/login")
        .set("content-type", "application/json")
        .send(existUser);

      expect(res.status).toEqual(httpStatus.OK);
      expect(res.body).toEqual({
        success: true,
        message: "User successfully deleted",
      });

      expect(failedLogin.status).toEqual(httpStatus.NOT_FOUND);
      expect(failedLogin.body).toEqual({
        success: false,
        message: "User Not Found",
        status: httpStatus.NOT_FOUND,
      });
    });
  });
});

const getToken = async (existUser) => {
  delete existUser.firstName;
  delete existUser.lastName;
  res = await request(app)
    .post("/api/login")
    .set("content-type", "application/json")
    .send(existUser);
  return res;
};
