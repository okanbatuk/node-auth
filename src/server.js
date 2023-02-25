const app = require("./configs/express");
const vars = require("./configs/vars");

app.listen(vars.port, (err) => {
  if (err) throw err;
  console.log(`Listening on port: ${vars.port}`);
});
