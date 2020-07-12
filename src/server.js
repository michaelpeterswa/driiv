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

const file = fs.readFileSync("data/secrets.yml", "utf8");
yamlfile = YAML.parse(file);

apikey = yamlfile.secrets.apikey;
appid = yamlfile.secrets.appid;

// var request = {
//   departure_searches: [
//     {
//       id: "first_location",
//       coords: latLng,
//       transportation: {
//         type: "car",
//       },

//       departure_time: departureTime,
//       travel_time: travelTime,
//     },
//   ],

//   arrival_searches: [],
// };

//////////////////////////////////

app.use(cors());
app.use(
  bp.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));

function getTimeMapAPI(lat_long) {
  var departureTime = new Date().toJSON();
  var travelTime = 60 * 60;

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
      console.log(res.text);
    });
}

function geocode(location) {
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
      getTimeMapAPI(latlng);
    });
}

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
  geocode("Seattle, WA");
});

const app_server = app.listen(app_port, () =>
  console.log(`driiv server app listening on port ${app_port}!\n`)
);

module.exports = app_server;
