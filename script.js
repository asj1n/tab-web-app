var currentVisibleScreen = document.getElementById("playScreen");
var boardColumns = 7;
var messageNumber = 1;
var opponent = "AI";
var whoRollsDiceFirst = "Player1";
var aiDifficultyLevel = "Easy";
var player1Wins = 0;
var player2Wins = 0;
var aiWins = 0;

var currentPlayer = 1;
var diceButton = document.getElementById("rollDiceButton");
var latestDiceValue = 0;

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
    
    getSize() {
        return this.array.length;
    }
    
    // getPieceId() { }

    // canPieceMove(steps) { }
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
                    cellPiece.style.transition = "transform 0.15s ease, background 0.15s ease";
                    cellPiece.style.transform = "scale(1.08)";
                });

                cellPiece.addEventListener("mouseleave", (event) => {
                    // transparent highlight on targetDestination(s)
                    cellPiece.style.transition = "transform 0.15s ease, background 0.15s ease";
                    cellPiece.style.transform = "scale(1)";
                });

                cellPiece.addEventListener("click", (event) => {
                    let id = event.target.id;
                    if (currentPlayer == 1) {
                        if (this.board.getContentOnPosition(id)?.owner == "Player1") {
                            //console.log("Valid Selection")
                            userMove(parseInt(id))
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
    game.makeMove(selectedPieceId);
    resetDices();

    currentPlayer = 2;

    aiMove();
}

function aiMove() {

    setTimeout(() => {
        rollDice();
        // give priority to moves that end up conquering a user's piece
        // give priority in case of a 1 to piece wwhose state is "neverMoved"
        // selectedPieceId = chosenRandomPieceId() 

        // game.makeMove(selectedPieceId)

        currentPlayer = 1;
        diceButton.disabled = false;

        console.log("AI Dice value", latestDiceValue)

        setTimeout(resetDices, 2000);
    }, 2000);
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
    
    game = new Game();
    board = game.board;
    


    console.log("Start Game! button pressed");
}
