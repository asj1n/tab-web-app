var currentVisibleScreen = document.getElementById("playScreen");
var boardColumns = 7;
var messageNumber = 1;
var opponent = "AI";
var whoRollsDiceFirst = "Player1";
var aiDifficultyLevel = "Easy";
var player1Wins = 0;
var player2Wins = 0;
var aiWins = 0;


class Piece {
    constructor(state, playerItBelongsTo, location) {
        this.state = state; // 0 - foi comida, 1 - n se mexeu, 2 - ja se mexeu mas nao esteve na 4a linha, 3 - ja teve na 4a linha
        this.playerItBelongsTo = playerItBelongsTo;
        this.location = location;
    }

    setState(state) {
        this.state = state;
    }
}

class Tab {
    constructor(columns) {
        this.board = new Array(columns * 4).fill(null);
    }

    setBoard(board) {
        this.board = board;
    }
}

var game = new Tab(boardColumns);


window.onload = () => {
    // let game = new Tab(7);
    console.log(game);
    console.log("Playing against: " + opponent);
    console.log("Rolls dice first: " + whoRollsDiceFirst);
    console.log("AI Level: " + aiDifficultyLevel);
    console.log(generateBoard(boardColumns));
    // show(currentVisibleScreen);
}

function generateBoard() {
    const boardContainer = document.getElementById('boardContainer');
    boardContainer.innerHTML = '';
    boardContainer.style.gridTemplateColumns = `repeat(${boardColumns}, 60px)`;

    const boardArray = [];

    for (let i = 3; i >= 0; i--) {
        const isEvenRow = i % 2 == 0;

        for (let j = 0; j < boardColumns; j++) {
            const cellBox = document.createElement('div');
            cellBox.classList.add('cellBox');

            const cellPiece = document.createElement('div');
            cellPiece.classList.add('cellPiece');

            if (isEvenRow) {
                cellPiece.setAttribute("id", i * boardColumns + j);
                // cellPiece.textContent = i * boardColumns + j;
            } else {
                cellPiece.setAttribute("id", (i + 1) * boardColumns - (j + 1));
                // cellPiece.textContent = (i + 1) * boardColumns - (j + 1);
            }

            if (i == 0 || i == 3) {
                cellPiece.addEventListener("mouseenter", () => {
                    cellPiece.style.transition = "transform 0.15s ease, background 0.15s ease";
                    cellPiece.style.transform = "scale(1.08)";
                });

                cellPiece.addEventListener("mouseleave", () => {
                    cellPiece.style.transition = "transform 0.15s ease, background 0.15s ease";
                    cellPiece.style.transform = "scale(1)";
                });

                if (i == 0) {
                    cellPiece.setAttribute("style", "background-color: rgb(50, 91, 225); border: 3px solid rgba(85, 123, 247, 1);");
                } else {
                    cellPiece.setAttribute("style", "background-color: rgb(225, 59, 50); border: 3px solid rgba(252, 116, 109, 1)")
                }
            }

            // cellBox.textContent = "➜";
            cellBox.appendChild(cellPiece);
            boardArray.push(null);

            // Optional: attach Piece object to cell
            // const piece = new Piece('white'); // default or empty
            // boardArray.push(piece);

            boardContainer.appendChild(cellBox);
        }
    }

    return boardArray;
}

function show(elementId) {
    let screenToShow = document.getElementById(elementId);
    currentVisibleScreen.style.display = "none";
    screenToShow.style.display = "flex";
    currentVisibleScreen = screenToShow;
}

function rollDice() {
    let value = 0;

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
    console.log(value);
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

function forfeit() {
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
    document.getElementById("player1").innerHTML = player1Wins;
    document.getElementById("ai").innerHTML = aiWins;
    document.getElementById("player2").innerHTML = "<s>" + player2Wins + "</s>";
}

function saveSettings() {
    boardColumns = document.getElementById("columnSelector").value;
    opponent = document.querySelector('input[name = "vs"]:checked').value;
    whoRollsDiceFirst = document.querySelector('input[name = "whoFirst"]:checked').value;
    aiDifficultyLevel = document.querySelector('input[name = "aiLevel"]:checked').value;
    game.board = generateBoard();
    show("playScreen"); // Automatically switch to playScreen again. Comment if unwanted.

    // console.clear();
    console.log("\n\n--------------------------------- UPDATE ----------------------------------\n")
    console.log(game);
    console.log("Playing against: " + opponent);
    console.log("Rolls dice first: " + whoRollsDiceFirst);
    console.log("AI Level: " + aiDifficultyLevel);
    console.log("------------------------------------------------------------\n\n")
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
