var express = require("express");
var http = require("http");
var websocket = require("ws");

var indexRouter = require("./routes/index");

var gameStatus = require("./statTracker");
var Game = require("./game");

var port = process.argv[2];
var app = express();

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

app.get("/play", indexRouter);

app.get("/welcome", (req, res) => {
  res.render("splash.ejs", {
    gamesInitialized: gameStatus.gamesInitialized,
    gamesCompleted: gameStatus.gamesCompleted,
    gamePlayers: gameStatus.gamePlayers
  });
});

var currentGame = new Game(gameStatus.gamesInitialized++);
var connectionID = 0;
var playerID = 0;

var games = {};
var players = [];

var server = http.createServer(app);
const wss = new websocket.Server({ server });

setInterval(function() {
  for (let i in games) {
    if (Object.prototype.hasOwnProperty.call(games,i)) {
      let gameObj = games[i];
      //if the gameObj has a final status, the game is complete/aborted
      if (gameObj.finalStatus != null || gameObj.gameState > 4) {
        delete games[i];
      }
    }
  }
}, 50000);


wss.on("connection", function connection(ws) {

  if (players.length == 2) {
    players.splice(0, players.length);
  }


  let con = ws;
  con.id = connectionID++;
  games[con.id] = currentGame;
  let playerType = currentGame.addPlayer(con);
  playerID++;
  gameStatus.gamePlayers++;

  console.log(
    "Player %s placed in game %s as %s with ID %s",
    con.id,
    currentGame.gameId,
    playerType,
    playerID
  );

  players.push(con);

  if (playerType == "Red") {

    const payLoad = {
      "gameId": currentGame.gameId,
      "gameState": currentGame.gameState,
      "currentPlayer": "Red"
    }
    con.send(JSON.stringify(payLoad));

  }

  if (playerType == "Blue") {

    const payLoad = {
      "gameId": currentGame.gameId,
      "gameState": currentGame.gameState,
      "currentPlayer": "Blue"
    }

    con.send(JSON.stringify(payLoad));
  }

  if(currentGame.hasTwoConnectedPlayers()){

    currentGame = new Game(gameStatus.gamesInitialized++);
  }

  con.on("message", message => {

    let gameObj = games[con.id];
    const result = JSON.parse(message);
    let isWon = false;

    players.forEach(function each(client) {
      if (client.readyState === websocket.OPEN) {
        client.send(message);
      }
    });

    if (result.gameState == 3) {

      gameObj.setGameState(3);

      const payLoad = {
        "gameId": gameObj.gameId,
        "gameState": gameObj.gameState,
        "currentPlayer": "Red"
      }
  
      con.send(JSON.stringify(payLoad));
    }

    if (result.gameState == 4) {

      gameObj.setGameState(4);

      const payLoad = {
        "gameId": gameObj.gameId,
        "gameState": gameObj.gameState,
        "currentPlayer": "Blue"
      }
  
      con.send(JSON.stringify(payLoad));
    }

    if(result.gameState == 5){
      gameObj.setGameState(5);
      isWon = true;

      const payLoad = {
        "method": "closeGame"
      }

      con.send(JSON.stringify(payLoad));

    }

    if(result.gameState == 6){
      gameObj.setGameState(6);
      isWon = true;

      const payLoad = {
        "method": "closeGame"
      }

      con.send(JSON.stringify(payLoad));
      
    }

    if(result.gameState == 7){
      gameObj.setGameState(7);

      gameStatus.gamesAborted++;

     
      gameObj.playerRed = null;
      gameObj.playerBlue = null;
    }

    if (isWon) {
      gameStatus.gamesCompleted++;
    }

    

  })



  con.on("close", function(code){
    console.log(con.id + " disconnected");


    players.forEach(function each(client) {
      if (client.readyState === websocket.OPEN) {
        client.send(code);
      }
    });

    let gameObj = games[con.id];

    const payLoad = {
      "gameId": gameObj.gameId, 
      "method": "closeGame"
    }

    con.send(JSON.stringify(payLoad));


  })




})

server.listen(port);