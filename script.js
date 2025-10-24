var currentVisibleScreen = document.getElementById("playScreen");
var playerWins = 0;
var aiWins = 0;
var boardColumns = 9;
var messageNumber = 1;


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

    let updateValueDisplay = document.getElementById("diceValue");
    updateValueDisplay.textContent = value;
    let updatePlayName = document.getElementById("diceValueName");
    updatePlayName.textContent = diceValueName(value);
    console.log(total);
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
    document.getElementById("player1").innerHTML = playerWins;
    document.getElementById("ai").innerHTML = aiWins;
}

function saveSettings() {
    boardColumns = document.getElementById("columnSelector").value;
    console.log(boardColumns);

    // show('playScreen')
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