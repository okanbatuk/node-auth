const app = require("./configs/express");
const vars = require("./configs/vars");
const connectDB = require("./configs/db.con");

app.listen(vars.port, (err) => {
  if (err) throw err;
  connectDB();
  console.log(`Listening on port: ${vars.port}`);
});
