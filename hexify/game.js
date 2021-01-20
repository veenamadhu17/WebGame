function Game(gameId) {
  this.gameId = gameId;
  this.playerRed = null;
  this.playerBlue = null;
  this.gameState = 0;
  this.players = {};

  this.addPlayer = function(p) {
    if (this.gameState == 0 | this.gameState == 1) {
      this.gameState++;
      if (this.playerRed == null) {
        this.playerRed = p;
        return "Red";
      }
      else {
        this.playerBlue = p;
        return "Blue";
      }
    }
  }

  this.setGameState = function (n) {
    this.gameState = n;
  }

  this.hasTwoConnectedPlayers = function() {
    return this.gameState > 1 && this.gameState != 7;
  }

}

module.exports = Game;