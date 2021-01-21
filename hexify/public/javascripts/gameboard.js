
/**
 * Assign the sound file to the variable soundLose, so to use it once a player loses the game
 */
let soundLose = new Audio("../Audio/lose.mp3");


/**
 * Create an object that functions as a status bar
 * This object can then call the method setStatus() - used to change that status throughout the game
 */
function StatusBar(){


    /**
     * Method to change status of a game's StatusBar
     * @param status
     */
    this.setStatus = function(status){
        document.getElementById("gameStatus").innerHTML = status;
    }
}

/**
 * Variables to draw the game board
 * hexSize - size of a hexagon on gameboard
 * gridCanvas - accesses the canvas element on game.html
 * gridCtx - variable used to draw gameboard
 * hexOrigin - point used to start drawing game board on screen
 * 
 * movesPlayed - accesses section designated for tracking of moves
 * timeElapsed - accesses section designated for duration of game
 * 
 * establish the two player colors: red #b80606 and blue #568e
 * 
 * strMoves - string used to store moves
 */
const hexSize = 25;
let gridCanvas = document.getElementById('gridCanvas');
gridCtx = gridCanvas.getContext('2d');
hexOrigin = new Point(10, 90);

movesPlayed = document.getElementById('movesPlayed');
timeElapsed = document.getElementById('timeElapsed');

let redColor = "#b80606";
let blueColor = "#568e";

strMoves = "";

/**
 * GameState is used to refer to the game itself on client side
 * without creating a new game for each client
 * 
 * @param hexGrid - game grid
 * @param sb - status bar
 */
function GameState(hexGrid, sb){
    this.playerType = null;
    this.hexGrid = hexGrid;
    this.sb = sb;
    this.winner = null;

    /**
     * Getter for player type
     * @return playerType
     */
    this.getPlayerType = function(){
        return this.playerType;
    }

    /**
     * Setter for playerType
     */
    this.setPlayerType = function(p){
        this.playerType = p;
    }

    /**
     * Setter for gameboard
     * Creates a new map that contains all moves played so far (listing them as invalid)
     * calls the function drawHexes()
     */
    this.setGameBoard = function(){
        this.invalidMoves = new Map();
        drawHexes(this.hexGrid);
    }

}

/**
 * Variables used to initiate a game and keep track of gamePlay
 * socket - creates new websocket on address localhost:3000
 * 
 * hexGrid - map for gameboard
 * movesMade - array to keep track of movesMade
 * sb - setting a new status bar
 * gs - setting a new gameState
 * redClicked - array for Reds moves
 * blueClicked - array for Blue's moves
 * currentGameState - indicates game's state
 * currentGameID - indicates game's ID
 * playerColor - used to refer to player's color
 * timecount - used to start the timecount
 * 
 */
socket = new WebSocket("ws://localhost:3000");

let hexGrid = new Map();
let movesMade = [];
let sb = new StatusBar();
let gs = new GameState(hexGrid, sb);
var redClicked = new Array();
var blueClicked = new Array();
let currentGameState = null;
let currentGameId = null;
let playerColor = null;
let timeCount = 0;



/**
 * This function adds interactive features to the page, allowing the gameplay
 * DOMContentLoaded ensures that the page is first fully loaded before allowing clicks
 *
 */
window.addEventListener('DOMContentLoaded', function () {
    gs.setGameBoard();

    /**
     * adds a click functionality on the gameboard itself
     * the 2 for loops allow access to any possible position on the gameboard
     * 
     * the function cuberound transforms the coordinates of the mouse to a hexagon object
     * 
     * the code itself is used to play on the board (ie check if a move is available, play said move,...)
     * when a move is played the server is informed by sending payLoad through a socket
     */
    gridCanvas.addEventListener("click", function onClick(e) {
        let mouseX = e.clientX-gridCanvas.getBoundingClientRect().left;
        let mouseY = e.clientY-gridCanvas.getBoundingClientRect().top;
        let currentHex = cubeRound(pixelToHex(new Point(mouseX, mouseY)));
        let center = hexToPixel(currentHex);
        let char = 'A';
        for (let i = 1; i < 12; i++) {
            for (let j = 1; j < 12; j++) {
                let compHex =  hexGrid.get(char+j);
                if (compHex.q == currentHex.q & compHex.r == currentHex.r) {
                    let position = char+j;
                    if (movesMade.includes(position)) {
                        window.alert("Invalid move, click an empty piece");
                    }
                    else {
                        if (currentGameState == 3 && playerColor == "Red") {
                            drawHex(gridCanvas, center, redColor, 0)
                            strMoves += position + "\n";


                            const payLoad = {
                                "method": "update moves",
                                "whoClicked": "Red",
                                "gameState": 4,
                                "position" : position,
                                "currentPlayer": "Red"
                            }

                            

                            socket.send(JSON.stringify(payLoad));
                            
                        }
                        else if(currentGameState == 4 && playerColor == "Blue") {
                            drawHex(gridCanvas, center, blueColor, 0)
                            strMoves += position + "\n";
                            
                            const payLoad = {
                                "method": "update moves",
                                "whoClicked": "Blue",
                                "gameState": 3,
                                "position" : position,
                                "currentPlayer": "Blue"
                            }
    
                            socket.send(JSON.stringify(payLoad));

                        }

                    }
                }
                if (j == 11) {
                    char = nextChar(char);
                }
            }
        }
       
    });
})


/**
 * Function used to define possible messages received by the client from the server
 * (if appropriate send a message back)
 */
socket.onmessage = function(event){
    const response = JSON.parse(event.data);


    if (response.gameState == 1) {
        sb.setStatus("Awaiting Player");
        window.alert("Your color is red");
        currentGameState = 1
        currentGameId = response.gameId;
        playerColor = response.currentPlayer;

    }

    if (response.gameState == 2) {
        sb.setStatus("Red's Turn");
        window.alert("Your color is blue");
        currentGameState = 2
        currentGameId = response.gameId;
        playerColor = response.currentPlayer;

        setInterval(() => {
            clock();
        }, 1000);

        const payLoad = {
            "gameState": 3,
            "currentPlayer": "Red"

        }

        socket.send(JSON.stringify(payLoad));
    }


    if (response.gameState == 3) {
        sb.setStatus("Red's Turn");
        currentGameState = 3;

        if (playerColor == "Red" && timeCount == 0) {
            setInterval(() => {
                clock();
            }, 1000);

            timeCount++;
    
        }
    }


    if (response.gameState == 3 && response.currentPlayer == "Blue") {
        let hexagon = hexGrid.get(response.position);
        let center = hexToPixel(hexagon);
        drawHex(gridCanvas, center, blueColor, 0);
        movesPlayed.innerHTML += response.position + " ";
    }

    if (response.gameState == 4) {
        sb.setStatus("Blue's Turn");
        currentGameState = 4;
    }

    if (response.gameState == 4 && response.currentPlayer == "Red") {
        let hexagon = hexGrid.get(response.position);
        let center = hexToPixel(hexagon);
        drawHex(gridCanvas, center, redColor, 0);
        movesPlayed.innerHTML += response.position + " ";
    }
    
    if (response.method == "update moves") {
        movesMade.push(response.position);
    }

    if (response.whoClicked == "Red") {
        redClicked.push(response.position);
        if(checkWin("Red")){
            const payLoad = {
                "gameState": 5,

            }
            socket.send(JSON.stringify(payLoad));
        }
    }

    if (response.whoClicked == "Blue") {
        blueClicked.push(response.position);
        if(checkWin("Blue")){
            const payLoad = {
                "gameState": 6,

            }
            socket.send(JSON.stringify(payLoad));
        }
    }

    if(response.gameState == 5){
        window.alert("Red won the game, click New Game to play again");
        sb.setStatus("Red Won!");
        if (playerColor == "Blue") {
            soundLose.play();
        }
        var newGridCanvas = gridCanvas.cloneNode(true);
        gridCanvas.parentNode.replaceChild(newGridCanvas, gridCanvas);

    }

    if(response.gameState == 6){
        window.alert("Blue won the game, click New Game to play again");
        sb.setStatus("Blue Won!");
        if (playerColor == "Red") {
            soundLose.play();
        }
        var newGridCanvas = gridCanvas.cloneNode(true);
        gridCanvas.parentNode.replaceChild(newGridCanvas, gridCanvas);

    }

    if(response.method == "closeGame"){
        const payLoad = {
            "gameState": 7
        }
        socket.send(JSON.stringify(payLoad));

    }

    if(response == 1001){

        console.log("Received game state 7");
        window.alert("Game aborted, click New Game to proceed");
        var newGridCanvas = gridCanvas.cloneNode(true);
        gridCanvas.parentNode.replaceChild(newGridCanvas, gridCanvas);

    }
    

};







// all functions till nextChar(c) is called is used to draw the game board
/**
 * Define a Point
 */
function Point(x, y) {
    this.x = x;
    this.y = y;
}

/**
 * Function to get the coordinates of a hexagons vertex
 * @param center - center of a hexagon
 * @param i - helper parameter (vertex number)
 * @returns Point(x,y)
 */
function getHexCornerCoord(center, i) {
    let angle_deg = 60 * i - 30;
    let angle_rad = Math.PI / 180 * angle_deg;
    let x = center.x + hexSize * Math.cos(angle_rad);
    let y = center.y + hexSize * Math.sin(angle_rad);
    return new Point(x, y);
}

/**
 * Method to draw a hexagon
 * @param canvasID
 * @param center
 * @param color
 * @param width
 */
function drawHex(canvasID, center, color, width) {
    const ctx = canvasID.getContext('2d');
    ctx.lineWidth = width;
    ctx.strokeStyle = "#000000";
    let start = getHexCornerCoord(center, 0);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    for (let i = 0; i <=5; i++) {
        let end = getHexCornerCoord(center, i + 1);
        ctx.lineTo(end.x, end.y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fill();
}

/**
 * method to draw a hexagon and its respective number
 * @param canvasID
 * @param center
 * @param color
 * @param width
 * @param num
 */
function drawHexwithNum(canvasID, center, num, color, width) {
    const ctx = canvasID.getContext('2d');
    ctx.lineWidth = width;
    ctx.strokeStyle = "#000000";
    let start = getHexCornerCoord(center, 0);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    for (let i = 0; i <=5; i++) {
        let end = getHexCornerCoord(center, i + 1);
        ctx.lineTo(end.x, end.y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeText(num, center.x, center.y);
}




/**
 * method to draw a hexagon and its respective letter
 * @param canvasID
 * @param center
 * @param color
 * @param width
 * @param num
 */
function drawHexwithLetter(canvasID, center, char, color, width) {
    const ctx = canvasID.getContext('2d');
    ctx.lineWidth = width;
    ctx.strokeStyle = "#000000";
    let start = getHexCornerCoord(center, 0);
    ctx.beginPath();
    for (let i = 0; i <= 5; i++) {
        let end = getHexCornerCoord(center, i + 1);
        ctx.lineTo(end.x, end.y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeText(char, center.x, center.y);
}

/**
 * Method to draw hexagons on a grid and get visual representation of a board
 * Inner hexagons are empty and the borders each have their respective colors and labels
 */
function drawHexes(hexGrid) {
    let char = 'A';
    gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
    for(let y = 0; y < 13; y++) {
        for (let x = 0; x < 13; x++) {
            currentHex = new Hex(y, x);
            let center = hexToPixel(currentHex);
            if ((y == 0 | y == 12) & (x > 0 & x < 12)) {
                drawHexwithNum(gridCanvas, center, x, "#568e", 1);
                if (y == 0) {
                    hexGrid.set("left " + x, currentHex);
                }
                if (y == 12) {
                    hexGrid.set("right " + x, currentHex);
                }
            } else if ((x == 0 | x == 12) & (y > 0 & y < 12)) {
                drawHexwithLetter(gridCanvas, center, char, "#b80606", 1);
                if (x == 0) {
                    hexGrid.set("top " + char, currentHex);
                }
                if (x == 12) {
                    hexGrid.set("bottom " + char, currentHex);
                    char = nextChar(char);
                }
            } else if (y == 0 & x == 12 | y == 12 & x == 0) {
                drawHex(gridCanvas, center, "#b80606", 1);
            } else if (y == 0 & x == 0 | y == 12 & x == 12) {
                continue;
            }
            else {
                drawHex(gridCanvas, center, "#f8f3eb", 1);
                if ((y != 0 & y != 12)) {
                    hexGrid.set(char+x, currentHex);
                }
            }
        }
    }
}


/**
 * function to retrieve the coordinates of hexagons center
 * @param hex
 * @returns Point(x,y)
 */
function hexToPixel(hex) {
    let x = hexSize * Math.sqrt(3) * (hex.q  + hex.r/2) + hexOrigin.x;
    let y = hexSize * (3/2 * hex.r) + hexOrigin.y;
    return new Point(x, y);
}

/**
 * function to transform a point to a hexagon with center q and index r
 * @param point
 * @returns Hex(q,r)
 */
function pixelToHex(point) {
    size = hexSize;
    let q = ((point.x - hexOrigin.x) * Math.sqrt(3)/3 - (point.y - hexOrigin.y)/ 3) / size;
    var r = (2/3 * (point.y-hexOrigin.y)) / size
    return new Hex(q, r)

}

/**
 * method used to return the coordinates in whole numbers
 * Code retrieved from 
 * https://www.redblobgames.com/grids/hexagons/
 */
function cubeRound(cube) {
    let rx = Math.round(cube.q);
    let ry = Math.round(cube.r);
    let rz = Math.round(cube.s);

    let x_diff = Math.abs(rx - cube.q);
    let y_diff = Math.abs(ry - cube.r);
    let z_diff = Math.abs(rz - cube.s);

    if (x_diff > y_diff && x_diff > z_diff) {
        rx= -ry-rz;
    } else {
        rz = -rx-ry;
    }

    return new Hex(rx, ry, rz);
}

/**
 * Create an object hexagon with 3 coordinates
 */
function Hex(q, r, s) {
    this.q = q;
    this.r = r;
    this.s = s;
}

/**
 * method to retrieve the character after c
 * @param c
 * @returns String
 */
function nextChar(c) {
    return String.fromCharCode(c.charCodeAt(0) + 1);
}

/**
 * method to retrieve character before c
 * @param c
 * @returns String
 */
function previousChar(c) {
    return String.fromCharCode(c.charCodeAt(0) - 1);
}

/**
 * method to define a clock incrementation
 */
let num = 0;
function clock() {
    num++;
    timeElapsed.innerHTML = num;
  }

/**
 * Method to check if a player meets winning conditions
 * 
 * If the player is red then it starts checking from line 1 to line 11 of the gameboard
 * calling checkNeighboursRed to check if there is a path between these lines
 * 
 * If the player is blue then it starts checking from line A to line K of the gameboard
 * calling checkNeighboursBlue to check if there is a path between these lines
 * 
 * @param color
 * @returns boolean
 */
function checkWin(color){
     var i;
     var char = 'A';
     var firstpos;
     var checked = [];
     var skipped = [];
     var result = null;
    if(color == "Red"){
        do{
            for(i = 1; i < 12; i++){
                
                if(redClicked.includes(char+1)){
                   firstpos = char+1;
                   result = checkNeighboursRed(firstpos, checked, skipped);
                   if(result == true){
                        return true;
                    }
                    
                }
                char = nextChar(char);
            }
            if(skipped.length !=0){
                firstpos = skipped.pop();
                result = checkNeighboursRed(firstpos, checked, skipped);
                   if(result == true){
                        return true;
               }
            }
        }while(skipped.length!=0);   
        return false
    };

    if(color == "Blue"){
        do{
            for(i = 1; i < 12; i++){
                
                if(blueClicked.includes(char+i)){
                   firstpos = char+i;
                   result = checkNeighboursBlue(firstpos, checked, skipped);
                   if(result == true){
                        return true;
                    }
                    
                }
            }
            if(skipped.length !=0){
                firstpos = skipped.pop();
                result = checkNeighboursBlue(firstpos, checked, skipped);
                if(result == true){
                        return true;
               }
            }
        }while(skipped.length!=0);   
        return false;

    }


 }




/**
 * After verifying that there is a hexagon in the 1st line that is red call this function
 * Verify if there are any other hexagons connected to this that are red
 * 
 * If so first check if they have already been checked (if so call checkNeighboursRed on them)
 * else skip them
 * 
 * If there are 2+ red hexagons beside it, add them to a waiting list (skipped), to be checked later
 * in case a dead end is reached
 *  
 * @param pos
 * @param checked
 * @param skipped
 * @returns boolean (true if we reach line 11)
 * */ 
function checkNeighboursRed(pos, checked, skipped){
     
     var char = pos.slice(0,1);
     var num = Number(pos.slice(1));
     var nextC = nextChar(char);
     var previousC = previousChar(char); 
     var temp;

    if(checked.includes(pos)){
        return;
    }
     if(num == 1){
         
        if(redClicked.includes(char + (num + 1))){
            skipped.push(char + (num +1));
        }
        if(redClicked.includes(previousC + (num + 1))){
            skipped.push(previousC + (num + 1));
        }
        if(skipped.length!=0){
         temp = skipped.pop();
         checked.push(char + num);
         return checkNeighboursRed(temp, checked, skipped);
        }
     }
     if(num == 11){
         return true;
         
     }
     else{
         if(redClicked.includes(char + (num - 1))){
             skipped.push(char + (num - 1));
        }
         if(redClicked.includes(nextC + (num - 1))){
             skipped.push(nextC + (num - 1));
         }
         if(redClicked.includes(nextC + num)){
             skipped.push(nextC + num);
         }
         if(redClicked.includes(char + (num + 1))){
             skipped.push(char + (num + 1));
         }
         if(redClicked.includes(previousC + (num + 1))){
             skipped.push(previousC + (num + 1));
         }
         if(redClicked.includes(previousC + (num))){
             skipped.push(previousC + num);
         }
         if(skipped.length!=0){
            temp = skipped.pop();
            checked.push(char + num);
            return checkNeighboursRed(temp, checked, skipped);
        }
         
     }
     return false;
    }

 /**
 * After verifying that there is a hexagon in the Ath line that is blue call this function
 * Verify if there are any other hexagons connected to this that are blue
 * 
 * If so first check if they have already been checked (if so call checkNeighboursBlue on them)
 * else skip them
 * 
 * If there are 2+ blue hexagons beside it, add them to a waiting list (skipped), to be checked later
 * in case a dead end is reached
 *  
 * @param pos
 * @param checked
 * @param skipped
 * @returns boolean (true if we reach line K)
 * */   
function checkNeighboursBlue(pos, checked, skipped){
     
    var char = pos.slice(0,1);
    var num = Number(pos.slice(1));
    var nextC = nextChar(char);
    var previousC = previousChar(char); 
    var temp;
   
    if(checked.includes(pos)){
        return;
    }
    if(char == 'A'){
            
        if(blueClicked.includes(nextC + (num + 1))){
            skipped.push(nextC + (num + 1));
        }
        if(blueClicked.includes(nextC + num)){
            skipped.push(nextC + num);
        }
        if(skipped.length!=0){
            temp = skipped.pop();
            checked.push(char + num);
            return checkNeighboursBlue(temp, checked, skipped);
        }
        }
    if(char == 'K'){
        return true;
            
    }
    else{
        if(blueClicked.includes(char + (num - 1))){
            skipped.push(char + (num - 1));
        }
        if(blueClicked.includes(nextC + (num - 1))){
            skipped.push(nextC + (num - 1));
        }
        if(blueClicked.includes(nextC + num)){
            skipped.push(nextC + num);
        }
        if(blueClicked.includes(char + (num + 1))){
            skipped.push(char + (num + 1));
        }
        if(blueClicked.includes(previousC + (num + 1))){
            skipped.push(previousC + (num + 1));
        }
        if(blueClicked.includes(previousC + (num))){
            skipped.push(previousC + num);
        }
        if(skipped.length!=0){
            temp = skipped.pop();
            checked.push(char + num);
            return checkNeighboursBlue(temp, checked, skipped);
        }
            
        }
        return false;
    }
   






