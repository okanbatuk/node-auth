const jwt = require("jsonwebtoken");
const vars = require("../../configs/vars");

//#region Generate Access Token
/*
 *
 * @private
 **/
exports.generateAccessToken = async (userInfo) => {
  return new Promise((resolve, reject) => {
    let accessToken = jwt.sign(userInfo, vars.ACCESS_TOKEN_SECRET, {
      expiresIn: "30s",
    });
    accessToken
      ? resolve(accessToken)
      : reject({ error: true, message: "Something went wrong!" });
  });
};
//#endregion

//#region Generate Refresh Token
/*
 *
 * @private
 * */
exports.generateRefreshToken = async (userInfo) => {
  return new Promise((resolve, reject) => {
    let refreshToken = jwt.sign(userInfo, vars.REFRESH_TOKEN_SECRET, {
      expiresIn: "1d",
    });
    refreshToken
      ? resolve(refreshToken)
      : reject({ error: true, message: "Something went wrong!" });
  });
};
//#endregion
