// clsl v1.0.0
// Michael Peters

const express = require("express");
const cors = require("cors");
const path = require("path");
const bp = require("body-parser");
const superagent = require("superagent");
const YAML = require("yaml");
const fs = require("fs");

// port the app is currently serving to
const app_port = 6981;

const app = express();
app.set("view engine", "ejs");

var geometry = "";
var location = "";
var data_size = "";
var time = "";

const file = fs.readFileSync("data/secrets.yml", "utf8");
yamlfile = YAML.parse(file);

apikey = yamlfile.secrets.apikey;
appid = yamlfile.secrets.appid;

var post_info = {
  address: "",
  coordinates: {},
  terabytes: 0,
  minutes: 0,
  int_speed: 0,
  gt_speed: 0,
};

//////////////////////////////////

app.use(cors());
app.use(
  bp.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));

function getTimeMapAPI(lat_long, res2) {
  var departureTime = new Date().toJSON();
  var travelTime = post_info.minutes * 60;

  var request = {
    departure_searches: [
      {
        id: "first_location",
        coords: lat_long,
        transportation: {
          type: "driving",
        },

        departure_time: departureTime,
        travel_time: travelTime,
      },
    ],

    arrival_searches: [],
  };

  superagent
    .post("https://api.traveltimeapp.com/v4/time-map")
    .set("X-Application-Id", appid)
    .set("X-Api-Key", apikey)
    .set("Content-Type", "application/json; charset=UTF-8")
    .send(JSON.stringify(request))
    .end(function (err, res) {
      geometry = JSON.parse(res.text);
      res2.redirect("/result");
    });
}

function geocode(location, res2) {
  superagent
    .get("https://api.traveltimeapp.com/v4/geocoding/search")
    .query({ query: location })
    .set("X-Application-Id", appid)
    .set("X-Api-Key", apikey)
    .set("Accept-Language", "en-US")
    .end(function (err, res) {
      result = JSON.parse(res.text);
      coords = result.features[0].geometry.coordinates;
      latlng = { lat: coords[1], lng: coords[0] };
      post_info.coordinates = latlng;
      getTimeMapAPI(latlng, res2);
    });
}

function renderIndex(res, bool) {
  if (bool == true) {
    res.render("index", {
      error: true,
    });
  } else {
    res.render("index", {
      error: false,
    });
  }
}

function calculateGroundTransferSpeed(time, size) {
  tb = size;
  mn = time;

  speed = (tb * 1024 * 1024) / (60 * mn);

  return speed.toFixed(2);
}

function renderResult(res, geometry, post_info) {
  let geo_string = JSON.stringify(geometry);
  // console.log(geo_string);
  res.render("result", {
    bounds: geo_string,
    location: post_info.location,
    data_size: post_info.terabytes,
    time: post_info.minutes,
    int_speed: post_info.int_speed,
    gt_speed: calculateGroundTransferSpeed(
      post_info.minutes,
      post_info.terabytes
    ),
    coordinates: JSON.stringify(post_info.coordinates),
  });
}

app.get("/", function (req, res) {
  renderIndex(res, false);
});

app.get("/result", function (req, res) {
  renderResult(res, geometry, post_info);
});

app.post("/api", function (req, res) {
  console.log(req.body);
  post_info.location = req.body.location;
  post_info.terabytes = req.body.data_size;
  post_info.minutes = req.body.time;
  post_info.int_speed = req.body.int_speed;
  geocode(post_info.location, res);
});

const app_server = app.listen(app_port, () =>
  console.log(`driiv server app listening on port ${app_port}!\n`)
);

module.exports = app_server;
