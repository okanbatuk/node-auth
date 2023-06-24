const jwt = require("jsonwebtoken");
const vars = require("../../configs/vars");

//#region Generate Access Token
/*
 *
 * @private
 **/
exports.generateAccessToken = async (userInfo) => {
  return new Promise((resolve, reject) => {
    let newAccessToken = jwt.sign(userInfo, vars.ACCESS_TOKEN_SECRET, {
      expiresIn: "10s",
    });
    newAccessToken
      ? resolve(newAccessToken)
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
    let newRefreshToken = jwt.sign(userInfo, vars.REFRESH_TOKEN_SECRET, {
      expiresIn: "1d",
    });
    newRefreshToken
      ? resolve(newRefreshToken)
      : reject({ error: true, message: "Something went wrong!" });
  });
};
//#endregion
