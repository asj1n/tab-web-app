var currentVisibleScreen = document.getElementById("playScreen");
var boardColumns = 7;
// var messageCounter = 1;
var opponent = "AI";
var whoRollsDiceFirst = "Player1";
var aiDifficultyLevel = "Easy";
var player1Wins = 0;
var player2Wins = 0;
var aiWins = 0;

var currentPlayer = whoRollsDiceFirst;
var latestDiceValue = 0;

var pieceWith2AlternativesSelected = false;
var pieceWith2AlternativesId = null;

var numbersToggled = false;

const forfeitPassTurnButtonArea = document.getElementById("forfeitPassTurnButtonArea");
const startGameButtonArea = document.getElementById("startGameButtonArea");

const blueScoreboard = document.getElementById("bluePiecesRemaining");
const redScoreboard = document.getElementById("redPiecesRemaining");

class Piece {
    constructor(position, owner) {
        this.position = position;
        this.state = "neverMoved"; // "neverMoved", "neverBeenInFourthRow", "hasBeenInFourthRow"
        this.owner = owner;        
    }

    getState() {
        return this.state;
    }

    setState(state) {
        this.state = state;
    }

    getPosition() {
        return this.position;
    }

    setPosition(position) {
        let positionRow = Math.floor(position / boardColumns) + 1;
        this.position = position;

        if (this.state != "hasBeenInFourthRow") {
            if (this.state == "neverMoved") {
                this.state = "neverBeenInFourthRow";
            } else if (positionRow == 4 && this.owner == "Player1") {
                this.state = "hasBeenInFourthRow";
            } else if (positionRow == 1 && this.owner == opponent) {
                this.state = "hasBeenInFourthRow";
            }
        }
    }

    getOwner() {
        return this.owner;
    }

    getColorBasedOnState() {
        if (this.owner == "Player1") {
            if (this.state == "neverMoved") {
                return "background-color: rgb(50, 91, 225); border: 3px solid rgba(181, 198, 252, 1);";
            } else if (this.state == "neverBeenInFourthRow") {
                return "background-color: rgb(50, 91, 225); border: 3px solid rgba(85, 123, 247, 1);";
            }   else {
                return "background-color: rgb(50, 91, 225); border: 3px solid rgba(0, 38, 163, 1);";
            }
        } else {
            if (this.state == "neverMoved") {
                return "background-color: rgb(225, 59, 50); border: 3px solid rgba(254, 201, 198, 1);";
            } else if (this.state == "neverBeenInFourthRow") {
                return "background-color: rgb(225, 59, 50); border: 3px solid rgba(252, 116, 109, 1);";
            }   else {
                return "background-color: rgb(225, 59, 50);; border: 3px solid rgba(157, 13, 6, 1);";
            }
        }
    }
}

class Board {
    constructor() {
        this.array = new Array(boardColumns * 4).fill(null);
        for (let i = 0 ; i < boardColumns; i++) { this.array[i] = new Piece(i, "Player1"); }
        for (let i = 3 * boardColumns; i < 4 * boardColumns; i++) { this.array[i] = new Piece(i, opponent); }
        // this.array[4 * boardColumns - 1] = new Piece(4 * boardColumns - 1, opponent); // for testing
    }

    movePiece(selectedPieceId, targetPosition) {
        let piece = this.array[selectedPieceId];
        let targetPiece = this.array[targetPosition];

        this.array[targetPosition] = piece;
        this.array[selectedPieceId] = null;
        piece.setPosition(targetPosition);

        return targetPiece;
    }

    isPositionFree(position) {
        return this.array[position] == null;
    }

    getPieceOnPosition(position) {
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
        this.updatePiecesOnUI();
        this.checkRemainingPieces();
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
                    let currPieceID = parseInt(event.target.id);
                    if (currentPlayer == "Player1" && game.board.getPieceOnPosition(currPieceID)?.owner == "Player1") {
                        let targetPositionsList = calculateUserTargetPositions(game.board.getPieceOnPosition(currPieceID));

                        if (currPieceID != pieceWith2AlternativesId) { 
                            pieceWith2AlternativesId = null;
                            pieceWith2AlternativesSelected = false;
                            this.updatePiecesOnUI();

                            cellPiece.style.transition = "transform 0.2s ease";
                            cellPiece.style.transform = "scale(1.08)";

                            for (let position of targetPositionsList) {
                                let positionId = position.toString();
                                document.getElementById(positionId).setAttribute("style", "background-color: rgba(11, 234, 26, 0.3); border: 3px dotted rgba(2, 25, 3, 0.45);")
                            }
                        }
                    }
                });

                cellPiece.addEventListener("mouseleave", (event) => {
                    let currPieceID = parseInt(event.target.id);
                    if (currentPlayer == "Player1" && game.board.getPieceOnPosition(currPieceID)?.owner == "Player1") {
                        let targetPositionsList = calculateUserTargetPositions(game.board.getPieceOnPosition(currPieceID));
                        
                        if (!pieceWith2AlternativesSelected) {
                            cellPiece.style.transition = "transform 0.2s ease";
                            cellPiece.style.transform = "scale(1)";

                            if (targetPositionsList.length != 0) {
                                console.log("updatedUI");
                                this.updatePiecesOnUI();
                            }
                        }
                    }
                });

                cellPiece.addEventListener("click", (event) => {
                    let currPieceID = parseInt(event.target.id);

                    if (currentPlayer == "Player1" && this.board.getPieceOnPosition(currPieceID)?.owner == "Player1") {
                        let possiblePositionsForUserMove = calculateUserTargetPositions(this.board.getPieceOnPosition(currPieceID));
                        
                        if (possiblePositionsForUserMove.length != 0) {
                            //console.log("Valid Selection")
                            if (possiblePositionsForUserMove.length == 2) {
                                pieceWith2AlternativesSelected = true;
                                pieceWith2AlternativesId = currPieceID;
                                console.log("2 Moves Possible")
                            } else {
                                pieceWith2AlternativesSelected = false;
                                pieceWith2AlternativesId = null;
                                userMove(currPieceID, possiblePositionsForUserMove[0]);
                            }
                        } else {
                            console.log("Piece " + currPieceID + " can't move.");
                        }

                    } else {
                        if (pieceWith2AlternativesSelected) {
                            let selectedPieceTargetPositions = calculateUserTargetPositions(this.board.getPieceOnPosition(pieceWith2AlternativesId));
                            if (selectedPieceTargetPositions.includes(currPieceID)) {
                                userMove(pieceWith2AlternativesId, currPieceID);
                            } else {
                                console.log("Position clicked not within: ", selectedPieceTargetPositions);
                            }
                        } else {
                            pieceWith2AlternativesSelected = false;
                            pieceWith2AlternativesId = null;
                            console.log("Invalid Selection");
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
                if (currentPiece.getOwner() == "Player1") {
                    cellToPaint.setAttribute("style", currentPiece.getColorBasedOnState());
                } else {
                    cellToPaint.setAttribute("style", currentPiece.getColorBasedOnState());
                }
            } else {
                cellToPaint.setAttribute("style", "background-color: transparent;");
            }
        }
    }

    toggleNumbersOnUI() {
        for (let i = 0; i < this.board.array.length; i++) {
            let cell = document.getElementById(i);

            if (numbersToggled) {
                cell.textContent = i;
            } else {
                cell.textContent = "";
            }
        }
    }


    isGameFinished() {
        return this.bluePiecesLeft == 0 || this.redPiecesLeft == 0; 
    }

    checkRemainingPieces() {
        let bluePiecesLeft = 0;
        let redPiecesLeft = 0;
        
        for (let i = 0; i < this.board.size(); i++) {
            let currentPiece = this.board.getPieceOnPosition(i);
            if (currentPiece?.getOwner() == "Player1") {
                bluePiecesLeft++;
            } else if (currentPiece?.getOwner() == opponent) {
                redPiecesLeft++;
            }
        }

        this.bluePiecesLeft = bluePiecesLeft;
        this.redPiecesLeft = redPiecesLeft;

        blueScoreboard.innerHTML = this.bluePiecesLeft;
        redScoreboard.innerHTML = this.redPiecesLeft;
    }

    makeMove(selectedPieceId, targetPosition) {
        let targetPositionPiece = this.board.movePiece(selectedPieceId, targetPosition);
        addNewMessage(currentPlayer + " moved piece in position " + selectedPieceId +" to " + targetPosition);

        if (targetPositionPiece != null) {
            addNewMessage(currentPlayer + " has captured a piece!");
        } 

        this.checkRemainingPieces();
        this.updatePiecesOnUI();

        if (this.isGameFinished()) {
            this.processWin();
        }
    }

    processWin(forfeit = false) {
        disablePassTurnButton();
        disableRollDiceButton();
        latestDiceValue = 0;
        
        if (forfeit || this.bluePiecesLeft == 0) {
            currentPlayer = opponent;
            addNewMessage(currentPlayer + " has won!");
            aiWins++;
        } else {
            addNewMessage("Player1 has won!");
            player1Wins++;
        }

        forfeitPassTurnButtonArea.style.display = "none";
        startGameButtonArea.style.display = "flex";
    }
}


var game = new Game();


window.onload = () => {
    console.log(game);
    console.log("Playing against: " + opponent);
    console.log("Rolls dice first: " + whoRollsDiceFirst);
    console.log("AI Level: " + aiDifficultyLevel);
    currentVisibleScreen.style.display = "flex";
    disableRollDiceButton();
}


function disableRollDiceButton() {
    const diceButton = document.getElementById("rollDiceButton");
    diceButton.disabled = true;
    diceButton.classList.toggle("disabled", true);
}

function enableRollDiceButton() {
    const diceButton = document.getElementById("rollDiceButton");
    diceButton.disabled = false;
    diceButton.classList.toggle("disabled", false);
}

function disablePassTurnButton() {
    const passTurnButton = document.getElementById("passTurnButton");
    passTurnButton.disabled = true;
    passTurnButton.classList.toggle("disabled", true);
}

function enablePassTurnButton() {
    const passTurnButton = document.getElementById("passTurnButton");
    passTurnButton.disabled = false;
    passTurnButton.classList.toggle("disabled", false);
}

function disableForfeitButton() {
    const forfeitButton = document.getElementById("forfeitButton");
    forfeitButton.disabled = true;
    forfeitButton.classList.toggle("disabled", true);
}

function enableForfeitButton() {
    const forfeitButton = document.getElementById("forfeitButton");
    forfeitButton.disabled = false;
    forfeitButton.classList.toggle("disabled", false);
}

function userMove(selectedPieceId, targetPosition) {
    if (latestDiceValue != 0) {
        let hasToRollAgain = willHaveToRollAgain(latestDiceValue);
  
        // let targetPosition;
        // if (possiblePositionsForUserMove.length > 1) {
        //     targetPosition = possiblePositionsForUserMove[1]; // If user has two choices, for now choose always first
        // }
        // else {
        //     targetPosition = possiblePositionsForUserMove[0];
        // }

        // console.log("User Move: (" + latestDiceValue + " " + hasToRollAgain + ") ", selectedPieceId + " -> " + targetPosition + " ", possiblePositionsForUserMove);

        game.makeMove(selectedPieceId, targetPosition);
        resetDices();

        if (game.isGameFinished()) {
            return;
        }

        if (hasToRollAgain) {
            enableRollDiceButton();
            latestDiceValue = 0;
        } else {
            disablePassTurnButton();
            currentPlayer = "AI";
            aiMove();
        }

    } else {
        console.log("Please throw the dice first.");
    }
}


function aiMove() {
    disableRollDiceButton();
    disablePassTurnButton();

    addNewMessage(currentPlayer + " it's your turn, please roll the dice");

    setTimeout(() => {
        rollDice();
        let hasToRollAgain = willHaveToRollAgain(latestDiceValue);      
        let validPiecesToMove = getAIValidPiecesToMove();

        if (validPiecesToMove.length == 0) {
            setTimeout(() => {
                resetDices();

                if (hasToRollAgain) {
                    aiMove();
                } else {
                    console.log("Your Turn");
                    addNewMessage(currentPlayer + " passed their turn");
                    currentPlayer = "Player1";
                    addNewMessage(currentPlayer + " it's your turn, please roll the dice");
                    enableRollDiceButton();
                    disablePassTurnButton();
                }
            }, 2000);

            return;
        }

        let randomPieceIndex = Math.floor(Math.random() * validPiecesToMove.length);
        let randomSelectedPiece = validPiecesToMove[randomPieceIndex];


        let selectedPiecePossibleMoves = calculateAITargetPositions(randomSelectedPiece);
        let randomMoveIndex = Math.floor(Math.random() * selectedPiecePossibleMoves.length);
        let randomChosenTarget = selectedPiecePossibleMoves[randomMoveIndex];

        console.log("AI Move: (" + latestDiceValue + " " + hasToRollAgain + ") ", randomSelectedPiece.getPosition() + " -> " + randomChosenTarget + " ", selectedPiecePossibleMoves);

        setTimeout(() => {
            game.makeMove(randomSelectedPiece.getPosition(), randomChosenTarget);
            latestDiceValue = 0;

            resetDices();

            if (game.isGameFinished()) {
                return;
            }
        
            if (hasToRollAgain) {
                aiMove();
            } else {
                console.log("Your Turn");
                currentPlayer = "Player1";
                addNewMessage(currentPlayer + " it's your turn, please roll the dice");
                enableRollDiceButton();
                disablePassTurnButton();
            }
        }, 2000);
    }, 2000);
}

function getAIPiecesOnBoard() {
    
    let aiPiecesList = [];

    for (let i = 0; i < game.board.size(); i++) {
        let piece = game.board.getPieceOnPosition(i); 
        if (piece?.owner == "AI") {
            aiPiecesList.push(piece);
        }
    }

    // console.log("Current AI pieces on board: ", aiPiecesList);
    return aiPiecesList;
}   


function getAIValidPiecesToMove() {

    let aiPiecesOnBoardList = getAIPiecesOnBoard();
    let aiValidPiecesToMoveList = [];

    for (let piece of aiPiecesOnBoardList) {
        let pieceTargetPositions = calculateAITargetPositions(piece);
        if (pieceTargetPositions.length > 0) {
            aiValidPiecesToMoveList.push(piece);
        }
    }
    return aiValidPiecesToMoveList;
}


function calculateUserTargetPositions(piece) {

    let targetPositions = [];

    let currentRow = Math.floor(piece.getPosition() / boardColumns) + 1;

    let targetPosition = piece.getPosition() + latestDiceValue;

    let targetRow = Math.floor(targetPosition / boardColumns) + 1;

    // a piece in the 4th row can only move if there aren't pieces of the same color in the 1st / initial row
    if (currentRow == 4) {
        for (let i = 0; i < boardColumns; i++) {
            if (game.board.getPieceOnPosition(i)?.getOwner() == "Player1") {
                return targetPositions;
            }
        }
    }

    // a piece in 4th row can only move if there are no remaining pieces in the 1st row

    if (currentRow == targetRow) { // if the piece doesn't have to change rows (jump)
        // can always move pieces forward in its own row except if the target position already cantains an allied piece
        // or when it has never moved and the dice value isnt a one
        if (game.board.isPositionFree(targetPosition) || game.board.getPieceOnPosition(targetPosition).getOwner() != currentPlayer) {
            if (piece.getState() == "neverMoved" && latestDiceValue == 1) {
                targetPositions.push(targetPosition);
            } else if (piece.getState() != "neverMoved") {
                targetPositions.push(targetPosition);
            }
        }

    } else { // if the piece has to change rows (jump)
        if (currentRow > 2) { // can jump down only in the 3rd and 4th rows 
            let rowEndPosition = (currentRow) * boardColumns - 1;
            let stepsToReachRowEnd = rowEndPosition - piece.getPosition();
            let secondTargetPosition = rowEndPosition - (2*boardColumns - 1) + (latestDiceValue - (stepsToReachRowEnd + 1)); 
            
            // can always jump down except when the target position is occupied by an ally piece
            if (game.board.isPositionFree(secondTargetPosition) || game.board.getPieceOnPosition(secondTargetPosition).getOwner() != currentPlayer) {
                targetPositions.push(secondTargetPosition);
            }
        }

        if (currentRow != 4) { // it can always jump up except in the 4th row

            // a piece can always jump up except when the target position is occupied by an ally piece
            // or when it is in the 3rd row and has already been in the 4th.
            if (game.board.isPositionFree(targetPosition) || game.board.getPieceOnPosition(targetPosition).getOwner() != currentPlayer) {
                if (!(piece.getState() == "hasBeenInFourthRow" && currentRow == 3) || (piece.getState() == "neverMoved" && latestDiceValue == 1)) {
                    if (piece.getState() == "neverMoved" && latestDiceValue == 1) {
                        targetPositions.push(targetPosition);
                    } else if (piece.getState() != "neverMoved") {
                        targetPositions.push(targetPosition);
                    }
                }
            }
        }
    }

    // console.log("Target Positions: ", targetPositions)
    return targetPositions;
}


function calculateAITargetPositions(piece) {

    let targetPositions = [];

    let currentRow = Math.floor(piece.getPosition() / boardColumns) + 1;

    let targetPosition = piece.getPosition() + latestDiceValue;

    let targetRow = Math.floor(targetPosition / boardColumns) + 1;


    // a piece in last row can only move if there are no remaining pieces in the initial row of the same color
    if (currentRow == 1) {
        for (let i = 3 * boardColumns; i < 4 * boardColumns; i++) {
            if (game.board.getPieceOnPosition(i)?.getOwner() == "AI") {
                return targetPositions;
            }
        }
    }

    if (currentRow == targetRow) { // if the piece doesn't have to change rows (jump)
        // can always move pieces forward in its own row except if the target position already cantains an allied piece
        // or when it has never moved and the dice value isnt a one
        if (game.board.isPositionFree(targetPosition) || game.board.getPieceOnPosition(targetPosition).getOwner() != currentPlayer) {
            if (piece.getState() == "neverMoved" && latestDiceValue == 1) {
                targetPositions.push(targetPosition);
            } else if (piece.getState() != "neverMoved") {
                targetPositions.push(targetPosition);
            }
        }

    } else { // if the piece has to change rows (jump)
        if (currentRow != 1) { // it can always jump up (from red POV, down from blue POV) except in the 1st row 
            let rowEndPosition = (currentRow) * boardColumns - 1;
            let stepsToReachRowEnd = rowEndPosition - piece.getPosition();
            let secondTargetPosition = rowEndPosition - (2*boardColumns - 1) + (latestDiceValue - (stepsToReachRowEnd + 1)); 
            
            // can always jump down except when the target position is occupied by an ally piece
            if (game.board.isPositionFree(secondTargetPosition) || game.board.getPieceOnPosition(secondTargetPosition).getOwner() != currentPlayer) {
                if (!(piece.getState() == "hasBeenInFourthRow" && currentRow == 2) || (piece.getState() == "neverMoved" && latestDiceValue == 1)) {
                    if (piece.getState() == "neverMoved" && latestDiceValue == 1) {
                        targetPositions.push(secondTargetPosition);
                    } else if (piece.getState() != "neverMoved") {
                        targetPositions.push(secondTargetPosition);
                    }
                }
            }
        }

        if (currentRow < 3) { // it can only jump down (from red POV, up from blue POV) in the 1st and 2nd rows
            if (game.board.isPositionFree(targetPosition) || game.board.getPieceOnPosition(targetPosition).getOwner() != currentPlayer) {
                targetPositions.push(targetPosition);
            }
        }
    }

    // console.log("Target Positions: ", targetPositions)
    return targetPositions;
}

function getUserValidPiecesToMove() {
    let userPiecesOnBoard = [];

    for (let i = 0; i < 4 * boardColumns; i++) {
        let piece = game.board.getPieceOnPosition(i);
        if (piece?.getOwner() == "Player1") {
            userPiecesOnBoard.push(piece);
        }
    }

    let userValidPiecesToMoveList = [];
    
    for (let piece of userPiecesOnBoard) {
        let pieceTargetPositions = calculateUserTargetPositions(piece);

        if (pieceTargetPositions.length > 0) {
            userValidPiecesToMoveList.push(piece);
        }
    }

    return userValidPiecesToMoveList;
} 

function show(elementId) {
    let screenToShow = document.getElementById(elementId);
    currentVisibleScreen.style.display = "none";
    screenToShow.style.display = "flex";
    currentVisibleScreen = screenToShow;
}

function rollDice() {
    let value = 0;

    disableRollDiceButton(); // prevent re-rolls

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
    
    latestDiceValue = value;

    addNewMessage(diceValueName(latestDiceValue) + " " + currentPlayer + " rolled a " + latestDiceValue);

    if (currentPlayer == "Player1") {
        let userValidPiecesToMoveList = getUserValidPiecesToMove();
        console.log("Available moves", userValidPiecesToMoveList);
        if (userValidPiecesToMoveList.length > 0) {
            disablePassTurnButton();
        } else {
            if (latestDiceValue == 4 || latestDiceValue == 6) {
                console.log("User can reroll again");
                addNewMessage(currentPlayer + " it's your turn, please roll the dice");
                disablePassTurnButton();

                setTimeout(() => {
                    resetDices();
                    enableRollDiceButton();
                }, 1000);
            } else {
                console.log("No moves available, enabling PassTurn button")
                addNewMessage(currentPlayer + " has no moves possible, please pass your turn");
                enablePassTurnButton();
            }
        }
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

function willHaveToRollAgain(value) {
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
    addNewMessage(currentPlayer + " has forfeited");
    game.processWin(true);
    console.log("Forfeit");
}

function passTurn() {
    console.clear();
    console.log("Turn Passed");
    resetDices();
    addNewMessage(currentPlayer + " passed their turn");
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
    currentPlayer = whoRollsDiceFirst;
    
    clearMessages();
    game = new Game();

    forfeitPassTurnButtonArea.style.display = "none";
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

function addNewMessage(message) {
    const list = document.getElementById("messagesList");
    const li = document.createElement("li");
    //li.textContent = messageCounter++ + " - " + message;
    li.textContent = message;
    li.classList.add("new-message");

    if (currentPlayer == "Player1") {
        li.classList.add("player1");
    } else {
        li.classList.add("ai");
    }

    // Add newest message to the beginning of the list so the newest is always on top
    list.insertBefore(li, list.firstChild);

    // remove highlight from last message
    setTimeout(() => {
        li.classList.remove("new-message")
    }, 2000);
}

function clearMessages() {
  const list = document.getElementById("messagesList");
  list.innerHTML = "";
//   messageCounter = 1;
}

function toggleNumbers() {
    numbersToggled = !numbersToggled;
    game.toggleNumbersOnUI();
}

function startGame() {
    forfeitPassTurnButtonArea.style.display = "flex";
    startGameButtonArea.style.display = "none";
    
    enableRollDiceButton();
    disablePassTurnButton();
    enableForfeitButton();
    clearMessages();
    
    game = new Game();

    currentPlayer = whoRollsDiceFirst;

    if (whoRollsDiceFirst == "AI") {
        aiMove();
    } else {
        addNewMessage(currentPlayer + " it's your turn, please roll the dice");
    }
    
    console.log("Start Game! button pressed");
}
