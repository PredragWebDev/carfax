require("dotenv").config();
//require("dd-trace").init();
const chalk = require("chalk");
const http = require("http");
const app = require("../server");

const port = process.env.APP_PORT || "80";
app.set("port", port);

const server = http.createServer(app);

server.listen(port, (err) => {
  if (err) return console.log("😫", chalk.red(err));
  console.log(`🚀  Now listening on port ${chalk.green(port)}`);
});

module.exports = server;
