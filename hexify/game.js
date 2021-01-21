

/**
 * Define what a game object is 
 * Game defined with:
 * - 2 players
 * - gameState
 * - players array(stores players at a particular game)
 * 
 * @param gameID - that game's ID
 */
function Game(gameId) {
  this.gameId = gameId;
  this.playerRed = null;
  this.playerBlue = null;
  this.gameState = 0;
  this.players = {};

  /**
   * Adds a player to a game and updates gameState
   */
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

  /**
   * Sets the gameState
   */
  this.setGameState = function (n) {
    this.gameState = n;
  }

  /**
   * Checks state of game to know if there are 2 connected players
   */
  this.hasTwoConnectedPlayers = function() {
    return this.gameState > 1 && this.gameState != 7;
  }

}

/**
 * Exports a game object
 */
module.exports = Game;