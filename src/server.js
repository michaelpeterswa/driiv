// clsl v1.0.0
// Michael Peters

const express = require("express");
const cors = require("cors");
const path = require("path");
const bp = require("body-parser")

// port the app is currently serving to
const app_port = 6981;

const app = express();
app.set("view engine", "ejs");

//////////////////////////////////

app.use(cors());
app.use(
  bp.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));

function renderIndex(res, bool) {
  if (bool == true) {
    res.render("index", {
      passworderror: true,
    });
  } else {
    res.render("index", {
      passworderror: false,
    });
  }
}

app.get("/", function (req, res) {
  renderIndex(res, false);
});

const app_server = app.listen(app_port, () =>
  console.log(`driiv server app listening on port ${app_port}!\n`)
);

module.exports = app_server;
