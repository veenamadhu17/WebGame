var express = require("express");
var router = express.Router();

/* GET home page */
router.get("/welcome", function(req, res) {
  res.sendFile("splash.html", { root: "./public" });
});

/* Pressing the 'PLAY' button, returns this page */
router.get("/play", function(req, res) {
  res.sendFile("game.html", { root: "./public" });
});

router.get("/rules", function(req, res) {
  res.sendFile("instructions.html", { root: "./public" });
});

module.exports = router;
