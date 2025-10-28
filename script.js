var currentVisibleScreen = document.getElementById("playScreen");
var boardColumns = 7;
var messageNumber = 1;
var opponent = "AI";
var whoRollsDiceFirst = "Player1";
var aiDifficultyLevel = "Easy";
var player1Wins = 0;
var player2Wins = 0;
var aiWins = 0;

var currentPlayer = "Player1";
var diceButton = document.getElementById("rollDiceButton");
var latestDiceValue = 0;

class Piece {
    constructor(position, owner) {
        this.position = position;
        this.state = "neverMoved"; // "neverMoved", "neverBeenInFourthRow", "hasBeenInFourthRow"
        // hashmap key = state, value = color;
        this.owner = owner;        
    }

    getState() {
        return this.state;
    }

    setState(state) {
        this.state = state;
        //update piece color
    }

    getPosition() {
        return this.position;
    }

    setPosition(position) {
        this.position = position;
    }

    getOwner() {
        return this.owner;
    }
}

class Board {
    constructor() {
        this.array = new Array(boardColumns * 4).fill(null);
        for (let i = 0 ; i < boardColumns; i++) { this.array[i] = new Piece(i, "Player1"); }
        for (let i = 3 * boardColumns; i < 4 * boardColumns; i++) { this.array[i] = new Piece(i, opponent); }
    }

    movePiece(selectedPieceId, steps) {
        let piece = this.array[selectedPieceId];
        let targetIndex = selectedPieceId + steps;

        // check for jumps
        piece.setState("neverBeenInFourthRow")
        piece.setPosition(targetIndex)

        this.array[targetIndex] = piece;
        this.array[selectedPieceId] = null;
    }

    isPositionFree(position) {
        return this.array[position] == null;
    }

    getContentOnPosition(position) {
        return this.array[position];
    }
    
    size() {
        return this.array.length;
    }
}

class Game {
    constructor() {
        this.board = new Board();
        this.bluePiecesLeft = boardColumns;
        this.redPiecesLeft = boardColumns;
        this.generateBoardUI();
        this.updatePiecesOnUI()
    }

    generateBoardUI() {
        const boardContainer = document.getElementById('boardContainer');
        boardContainer.innerHTML = '';
        boardContainer.style.gridTemplateColumns = `repeat(${boardColumns}, 60px)`;

        for (let i = 3; i >= 0; i--) {
            const isEvenRow = i % 2 == 0;

            for (let j = 0; j < boardColumns; j++) {
                const cellBox = document.createElement('div');
                cellBox.classList.add('cellBox');

                const cellPiece = document.createElement('div');
                cellPiece.classList.add('cellPiece');

                if (isEvenRow) {
                    cellPiece.setAttribute("id", i * boardColumns + j);
                    cellPiece.textContent = i * boardColumns + j;
                } else {
                    cellPiece.setAttribute("id", (i + 1) * boardColumns - (j + 1));
                    cellPiece.textContent = (i + 1) * boardColumns - (j + 1);
                }

                cellPiece.addEventListener("mouseenter", (event) => {
                    // transparent highlight on targetDestination(s)
                    let currPieceID = event.target.id;
                    let targetPositionsList = calculateTargetPositions(game.board.getContentOnPosition(parseInt(currPieceID)));
                    // console.log("Entered piece " + currPieceID + " with target Positions ", targetPositionsList);
                    // for (let position of targetPositionsList) {
                    //     let positionId = position.toString();
                    //     console.log(positionId);
                    //     document.getElementById(positionId).setAttribute("style", "background-color: rgba(11, 234, 26, 0.3);")
                    // }
                    cellPiece.style.transition = "transform 0.15s ease, background 0.15s ease";
                    cellPiece.style.transform = "scale(1.08)";
                });

                cellPiece.addEventListener("mouseleave", (event) => {
                    // transparent highlight on targetDestination(s)
                    // let currPieceID = event.target.id;
                    // let targetPositionsList = calculateTargetPositions(parseInt(currPieceID));
                    // console.log("Exited piece " + currPieceID + " with target Positions ", targetPositionsList);
                    // for (let position of targetPositionsList) {
                    //     let positionId = position.toString();
                    //     console.log(positionId);
                    //     document.getElementById(positionId).setAttribute("style", "background-color: transparent;")
                    // }
                    cellPiece.style.transition = "transform 0.15s ease, background 0.15s ease";
                    cellPiece.style.transform = "scale(1)";
                });

                cellPiece.addEventListener("click", (event) => {
                    let id = event.target.id;
                    if (currentPlayer == "Player1") {
                        if (this.board.getContentOnPosition(id)?.owner == "Player1") {
                            if (calculateTargetPositions(this.board.getContentOnPosition(parseInt(id))).length != 0) {
                                //console.log("Valid Selection")
                                userMove(parseInt(id));
                            } else {
                                console.log("Piece " + id + " can't move.");
                            }

                        } else{
                            console.log("Invalid Selection")
                        }
                    }
                });

                cellBox.appendChild(cellPiece);;
                boardContainer.appendChild(cellBox);
            }
        }
    }

    updatePiecesOnUI() {
        for (let i = 0; i < this.board.array.length; i++) {
            let currentPiece = this.board.array[i];
            let cellToPaint = document.getElementById(i);

            if (currentPiece != null) {
                if (currentPiece.owner == "Player1") {
                    cellToPaint.setAttribute("style", "background-color: rgb(50, 91, 225); border: 3px solid rgba(85, 123, 247, 1);")
                } else {
                    cellToPaint.setAttribute("style", "background-color: rgb(225, 59, 50); border: 3px solid rgba(252, 116, 109, 1)")
                }
            } else {
                cellToPaint.setAttribute("style", "background-color: transparent;")
            }
        }
    }

    isGameFinished() {
        return this.bluePiecesLeft == 0 && this.redPiecesLeft == 0; 
    }

    makeMove(selectedPieceId) {
        this.board.movePiece(selectedPieceId, latestDiceValue);
        this.updatePiecesOnUI();
    }
}


var game = new Game();


window.onload = () => {
    console.log(game);
    console.log("Playing against: " + opponent);
    console.log("Rolls dice first: " + whoRollsDiceFirst);
    console.log("AI Level: " + aiDifficultyLevel);
    currentVisibleScreen.style.display = "flex";
}

function userMove(selectedPieceId) {
    if (latestDiceValue != 0) {
        let repeats = canRollAgain(latestDiceValue);
        game.makeMove(selectedPieceId);
        resetDices();

        if (repeats) {
            diceButton.disabled = false;
            latestDiceValue = 0;
        } else {
            currentPlayer = "AI";
            aiMove();
        }

    } else {
        console.log("Please throw the dice first.");
    }
}

function aiMove() {

    setTimeout(() => {
        rollDice();
        let repeats = canRollAgain(latestDiceValue);
        // give priority to moves that end up conquering a user's piece
        // give priority in case of a 1 to piece wwhose state is "neverMoved"
        // let selectedPieceId = chosenRandomPieceId() 
        // game.makeMove(selectedPieceId)        

        console.log(getAIValidMoves());
        // selecedPiceId.setState();


        console.log("AI Dice value", latestDiceValue)
        latestDiceValue = 0;

        setTimeout(() => {
            resetDices();
        
            if (repeats) {
                aiMove();
            } else {
                currentPlayer = "Player1";
                diceButton.disabled = false;
            }
        }, 2000);
    }, 2000);
}

function getAIPiecesOnBoard() {
    
    let aiPiecesList = [];

    for (let i = 0; i < game.board.size(); i++) {
        let piece = game.board.getContentOnPosition(i); 
        if (piece?.owner == "AI") {
            aiPiecesList.push(piece);
        }
    }

    console.log("Current AI pieces on board: ", aiPiecesList);
    return aiPiecesList;
}   


function getAIValidMoves() {

    let aiPiecesOnBoardList = getAIPiecesOnBoard();
    let aiValidMovesList = [];

    for (let piece of aiPiecesOnBoardList) {
        // if a piece has neverMoved and the dice is 1, it is valid
        // if a piece hasNever been in 4th row and wants to go, its valid
        let pieceTargetPositions = calculateTargetPositions(piece);
        if (pieceTargetPositions.length > 0) {
            aiValidMovesList.push(piece);
        }
    }
    return aiValidMovesList;
}


function calculateTargetPositions(piece) {
    // doesnt take into consideration piece's state for now
    // that will be checked by a method that evaluates which moves are valid;

    let targetPositions = [];

    let currentRow = Math.floor(piece.getPosition() / boardColumns) + 1;

    let targetPosition = piece.getPosition() + latestDiceValue;

    let targetRow = Math.floor(targetPosition / boardColumns) + 1;

    // if (game.board.isPositionFree(targetPosition) || game.board.getContentOnPosition(targetPosition).getOwner() != currentPlayer) {
    //     if (piece.getState() == "neverMoved" && latestDiceValue == 1) {
    //         targetPositions.push(targetPosition);
    //     }
    // }

    // a piece in 4th row can only move if there are no remaining pieces in the 1st row

    if (currentRow == targetRow) { // if the piece doesn't have to change rows (jump)
        // can always move pieces forward in its own row except if the target position already cantains an allied piece
        // or when it has never moved and the dice value isnt a one
        if (game.board.isPositionFree(targetPosition) || game.board.getContentOnPosition(targetPosition).getOwner() != currentPlayer) {
            if (piece.getState() == "neverMoved" && latestDiceValue == 1) {
                targetPositions.push(targetPosition);
            } else if (piece.getState() != "neverMoved") {
                console.log("Arrived Here");
                targetPositions.push(targetPosition);
            }
        }

    } else { // if the piece has to change rows (jump)
        if (currentRow > 2) { // can jump down only in the 3rd and 4th rows 
            let rowEndPosition = (currentRow) * boardColumns - 1;
            let stepsToReachRowEnd = rowEndPosition - piece.getPosition();
            let secondTargetPosition = rowEndPosition - (2*boardColumns - 1) + (latestDiceValue - (stepsToReachRowEnd + 1)); 
            
            // can always jump down except when the target position is occupied by an ally piece
            if (game.board.isPositionFree(secondTargetPosition) || game.board.getContentOnPosition(secondTargetPosition).getOwner() != currentPlayer) {
                targetPositions.push(secondTargetPosition);
            }
        }

        if (currentRow != 4) { // it can always jump up except in the 4th row

            // a piece can always jump up except when the target position is occupied by an ally piece
            // or when it is in the 3rd row and has already been in the 4th.
            // console.log("Checking Here")
            if (game.board.isPositionFree(targetPosition) || game.board.getContentOnPosition(targetPosition).getOwner() != currentPlayer) {
                if (!(piece.getState() == "hasBeenInFourthRow" && currentRow == 3) || (piece.getState() == "neverMoved" && latestDiceValue == 1)) {
                    if (piece.getState() == "neverMoved" && latestDiceValue == 1) {
                        targetPositions.push(targetPosition);
                    } else if (piece.getState() != "neverMoved") {
                        console.log("Arrived Here");
                        targetPositions.push(targetPosition);
                    }
                }
            }
        }
    }

    console.log("Target Positions: ", targetPositions)
    return targetPositions;
}


function show(elementId) {
    let screenToShow = document.getElementById(elementId);
    currentVisibleScreen.style.display = "none";
    screenToShow.style.display = "flex";
    currentVisibleScreen = screenToShow;
}

function rollDice() {
    if (document.getElementById("startGameButtonArea").style.display == "none") {
        let value = 0;

        diceButton.disabled = true; // prevent re-rolls

        for (i = 1; i <= 4; i++) {
            let random = Math.floor(Math.random() * 2);
            let dice = document.getElementById("dice" + i);
            value += random;

            if (random == 0) {
                dice.style.backgroundColor = "rgb(49, 26, 2)";
            } else {
                dice.style.backgroundColor = "rgb(224, 167, 105)";
            }
        }

        if (value == 0) { value = 6; }

        let updateValueDisplay = document.getElementById("diceCombinationValue");
        updateValueDisplay.textContent = value;
        let updatePlayName = document.getElementById("diceCombinationValueName");
        updatePlayName.textContent = diceValueName(value);
        console.log(value + " " + canRollAgain(value));

        latestDiceValue = value;
    } else {
        console.log("Please start the game first.")
    }
}   

function diceValueName(value) {
    switch (value) {
        case 1: return "Tâb!";
        case 2: return "Itneyn!";
        case 3: return "Teláteh!";
        case 4: return "Arba'ah!";
        default: return "Sitteh!";
    }
}

function canRollAgain(value) {
    switch (value) {
        case 1:
        case 4:
        case 6:
            return true;
        default: 
            return false;
    }
}

function resetDices() {
    document.getElementById("diceCombinationValue").textContent = "";
    document.getElementById("diceCombinationValueName").textContent = "";
    document.getElementById("dice1").setAttribute("style", "background-color: rgb(49, 26, 2)");
    document.getElementById("dice2").setAttribute("style", "background-color: rgb(49, 26, 2)");
    document.getElementById("dice3").setAttribute("style", "background-color: rgb(49, 26, 2)");
    document.getElementById("dice4").setAttribute("style", "background-color: rgb(49, 26, 2)");
}

function forfeit() {
    if (opponent == "AI") {
        aiWins++;
    } else {
        player2Wins++;
    }
    console.log("Forfeit");
}

function passTurn() {
    console.log("Turn Passed");
    diceButton.disabled = true;
    currentPlayer = opponent;
    aiMove();
}

function login() {
    let username = document.getElementById("usernameInput");
    let password = document.getElementById("passwordInput");

    alert("Sorry '" + username.value + "', login functionality not yet implemented!");
}

function scores() {
    document.getElementById("player1").innerText = player1Wins;
    document.getElementById("ai").innerText = aiWins;
    document.getElementById("player2").innerHTML = "<s>" + player2Wins + "</s>";
}

function saveSettings() {
    boardColumns = document.getElementById("columnSelector").value;
    opponent = document.querySelector('input[name = "vs"]:checked').value;
    whoRollsDiceFirst = document.querySelector('input[name = "whoFirst"]:checked').value;
    aiDifficultyLevel = document.querySelector('input[name = "aiLevel"]:checked').value;
    game = new Game();

    let forfeitPassTurnButtonArea = document.getElementById("forfeitPassTurnButtonArea");
    forfeitPassTurnButtonArea.style.display = "none";
    let startGameButtonArea = document.getElementById("startGameButtonArea");
    startGameButtonArea.style.display = "flex";
    resetDices();

    show("playScreen"); // Automatically switch to playScreen again. Comment if unwanted.

    // console.clear();
    // console.log("\n\n--------------------------------- UPDATE ----------------------------------\n")
    // console.log(game);
    // console.log("Playing against: " + opponent);
    // console.log("Rolls dice first: " + whoRollsDiceFirst);
    // console.log("AI Level: " + aiDifficultyLevel);
    // console.log("------------------------------------------------------------\n\n")
}

function addNewMessage() {
    const list = document.getElementById("messagesList");
    const li = document.createElement("li");
    li.textContent = messageNumber++ + " - Player X Turn";
    li.classList.add("new-message");
    // Add newest message to the beginning of the list so the newest is always on top
    list.insertBefore(li, list.firstChild);
    // remove highlight from last message
    setTimeout(() => li.classList.remove("new-message"), 2000);
}

function startGame() {
    let startGameButtonArea = document.getElementById("startGameButtonArea");
    startGameButtonArea.style.display = "none";
    let forfeitPassTurnButtonArea = document.getElementById("forfeitPassTurnButtonArea");
    forfeitPassTurnButtonArea.style.display = "flex";
    
    if (whoRollsDiceFirst == "AI") {
        aiMove();
    }
    
    console.log("Start Game! button pressed");
}
