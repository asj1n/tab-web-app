let currentVisibleScreen = document.getElementById("playScreen");
let boardColumns = 9;
let opponent = "AI";
let whoRollsDiceFirst = "Player1";
let aiDifficultyLevel = "Easy";
let player1Wins = 0;
let player2Wins = 0;
let aiWins = 0;

let currentPlayer = whoRollsDiceFirst;
let latestDiceValue = 0;

let pieceWith2AlternativesSelected = false;
let pieceWith2AlternativesId = null;

let numbersToggled = false;

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
    }

    movePiece(selectedPieceId, targetPosition) {
        // atualiza o board e a posição da peça e retorna a peça que estava nessa posição (pode ser null)
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
        this.updateRemainingPieces(null);
    }

    getBoard() {
        return this.board;
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
                } else {
                    cellPiece.setAttribute("id", (i + 1) * boardColumns - (j + 1));
                }

                cellPiece.addEventListener("mouseenter", (event) => {
                    let currPieceID = parseInt(event.target.id);

                    if (currentPlayer == "Player1" && game.getBoard().getPieceOnPosition(currPieceID)?.owner == "Player1") {
                        let targetPositionsList = calculateUserTargetPositions(game.getBoard().getPieceOnPosition(currPieceID));

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
                    if (currentPlayer == "Player1" && game.getBoard().getPieceOnPosition(currPieceID)?.owner == "Player1") {
                        let targetPositionsList = calculateUserTargetPositions(game.getBoard().getPieceOnPosition(currPieceID));
                        
                        if (!pieceWith2AlternativesSelected) {
                            cellPiece.style.transition = "transform 0.2s ease";
                            cellPiece.style.transform = "scale(1)";

                            if (targetPositionsList.length != 0) {
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
                            if (possiblePositionsForUserMove.length == 2) {
                                pieceWith2AlternativesSelected = true;
                                pieceWith2AlternativesId = currPieceID;
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
        // pinta o UI com base no estado atual do tabuleiro (quando chamada)
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
        // adiciona ou remove números no tabuleiro quando chamada dependendo de numbersToggled
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

    updateRemainingPieces(piece) {
        // atualiza o número de peças restantes na classe e no UI
        if (piece != null) {
            if (piece.getOwner() == "Player1") {
                this.bluePiecesLeft--;
            } else {
                this.redPiecesLeft--;
            }
        }

        blueScoreboard.innerHTML = this.bluePiecesLeft;
        redScoreboard.innerHTML = this.redPiecesLeft;
    }

    makeMove(selectedPieceId, targetPosition) {
        let targetPositionPiece = this.board.movePiece(selectedPieceId, targetPosition);
        addNewMessage(currentPlayer + " moved piece in position " + selectedPieceId +" to " + targetPosition);

        if (targetPositionPiece != null) {
            addNewMessage(currentPlayer + " has captured a piece!");
            this.updateRemainingPieces(targetPositionPiece);
        } 

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


let game = new Game();


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

        game.makeMove(selectedPieceId, targetPosition);
        resetDice();

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

        // se o AI não tiver nenhuma jogada possível (peças que se possam mover)
        // verificamos se pode lançar os dados outra vez ou não 
        if (validPiecesToMove.length == 0) {
            setTimeout(() => {
                resetDice();

                if (hasToRollAgain) {
                    aiMove();
                } else {
                    console.log("User's Turn");
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

            resetDice();

            if (game.isGameFinished()) {
                return;
            }
        
            if (hasToRollAgain) {
                aiMove();
            } else {
                console.log("User's Turn");
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

    for (let i = 0; i < game.getBoard().size(); i++) {
        let piece = game.getBoard().getPieceOnPosition(i); 
        if (piece?.owner == "AI") {
            aiPiecesList.push(piece);
        }
    }

    return aiPiecesList;
}   

function getAIValidPiecesToMove() {
    // retorna uma lista de peças do AI que podem ser movidas com base no estado
    // do jogo e no valor do latestDiceValue
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

    // uma peça que esteja na última fila (4a fila do POV do utilizador) só pode ser movida se
    // o utilizador não tiver peças suas (da mesma cor) na fila inicial (1a fila do POV do utilizador) 
    if (currentRow == 4) {
        for (let i = 0; i < boardColumns; i++) {
            if (game.getBoard().getPieceOnPosition(i)?.getOwner() == "Player1") {
                return targetPositions;
            }
        }
    }

    // se a linha em que a peça está coincidir com a fila na qual poderá calhar se o utilizador a jogar (não tem que mudar/saltar filas)
    if (currentRow == targetRow) {
        // verificamos se essa posição não está ocupada por uma peça do próprio utilizador
        // e verificamos o estado da peça (não pode mover-se se o estado é "neverMoved" e o valor do dado for diferente de 1)
        if (game.getBoard().isPositionFree(targetPosition) || game.getBoard().getPieceOnPosition(targetPosition).getOwner() != currentPlayer) {
            if (piece.getState() != "neverMoved" || (piece.getState() == "neverMoved" && latestDiceValue == 1)) {
                targetPositions.push(targetPosition);
            }
        }
    // caso contrário, a linha da peça não coincide com a fila na qual poderá calhar (tem que mudar / saltar de fila)
    } else { 
        // se a fila em que a peça se encontra for maior que 2 (fila 3 ou 4) do POV do utilizador, 
        // a peça tem oportunidade de saltar para a fila de baixo
        if (currentRow > 2) { 
            let rowEndPosition = (currentRow) * boardColumns - 1;
            let stepsToReachRowEnd = rowEndPosition - piece.getPosition();
            let secondTargetPosition = rowEndPosition - (2*boardColumns - 1) + (latestDiceValue - (stepsToReachRowEnd + 1)); 
            
            // verificamos se essa posição não está ocupada por uma peça do próprio utilizador
            if (game.getBoard().isPositionFree(secondTargetPosition) || game.getBoard().getPieceOnPosition(secondTargetPosition).getOwner() != currentPlayer) {
                targetPositions.push(secondTargetPosition);
            }
        }

        // se a fila em que a peça se encontra for diferente de 4 (última fila do POV do utilizador),
        // a peça tem a oportunidade de saltar para a fila de cima.
        if (currentRow != 4) {
            // verificamos se essa posição não está ocupada por uma peça do próprio utilizador
            // e verificamos o estado da peça (não pode mover-se se o estado é "neverMoved" e o valor do dado for diferente de 1 ou
            // se o seu estado é "hasBeenInFourthRow" e a peça está na 3a fila (do POV do utilizador))
            if (game.getBoard().isPositionFree(targetPosition) || game.getBoard().getPieceOnPosition(targetPosition).getOwner() != currentPlayer) {
                if (!(piece.getState() == "hasBeenInFourthRow" && currentRow == 3)) {
                    if (piece.getState() != "neverMoved" || (piece.getState() == "neverMoved" && latestDiceValue == 1)) {
                        targetPositions.push(targetPosition);
                    }
                }
            }
        }
    }

    return targetPositions;
}


function calculateAITargetPositions(piece) {

    let targetPositions = [];

    let currentRow = Math.floor(piece.getPosition() / boardColumns) + 1;

    let targetPosition = piece.getPosition() + latestDiceValue;

    let targetRow = Math.floor(targetPosition / boardColumns) + 1;


    // uma peça que esteja na última fila (4a do POV do AI, 1a fila do POV do utilizador) 
    // só pode ser movida se o AI não tiver peças suas (da mesma cor) na fila inicial (1a fila do POV 
    // do AI 4a do POV do utilizador) 
    if (currentRow == 1) {
        for (let i = 3 * boardColumns; i < 4 * boardColumns; i++) {
            if (game.getBoard().getPieceOnPosition(i)?.getOwner() == "AI") {
                return targetPositions;
            }
        }
    }

    // se a linha em que a peça está coincidir com a fila na qual poderá calhar se o AI a jogar (não tem que mudar/saltar filas)
    if (currentRow == targetRow) { 
        // verificamos se essa posição não está ocupada por uma peça do próprio AI
        // e verificamos o estado da peça (não pode mover-se se o estado é "neverMoved" e o valor do dado for diferente de 1)
        if (game.getBoard().isPositionFree(targetPosition) || game.getBoard().getPieceOnPosition(targetPosition).getOwner() != currentPlayer) {
            if (piece.getState() == "neverMoved" && latestDiceValue == 1 || (piece.getState() != "neverMoved")) {
                targetPositions.push(targetPosition);
            }
        }
    // caso contrário, a linha da peça não coincide com a fila na qual poderá calhar (tem que mudar / saltar de fila)
    } else { 
        // se a fila em que a peça se encontra for diferente de 1 (1a fila / incial do POV do utilizador
        // 4a / última fila do POV do AI), a peça tem a oportunidade de saltar para a fila de cima (para
        // baixo do POV do utilzador).
        if (currentRow != 1) {
            let rowEndPosition = (currentRow) * boardColumns - 1;
            let stepsToReachRowEnd = rowEndPosition - piece.getPosition();
            let secondTargetPosition = rowEndPosition - (2*boardColumns - 1) + (latestDiceValue - (stepsToReachRowEnd + 1)); 
            
            // verificamos se essa posição não está ocupada por uma peça do próprio utilizador
            // e verificamos o estado da peça (não pode mover-se se o estado é "neverMoved" e o valor do dado for diferente de 1 ou
            // se o seu estado é "hasBeenInFourthRow" e a peça está na 3a fila (do POV do utilizador))
            if (game.getBoard().isPositionFree(secondTargetPosition) || game.getBoard().getPieceOnPosition(secondTargetPosition).getOwner() != currentPlayer) {
                if (!(piece.getState() == "hasBeenInFourthRow" && currentRow == 2)) {
                    if (piece.getState() == "neverMoved" && latestDiceValue == 1 || (piece.getState() != "neverMoved")) {
                        targetPositions.push(secondTargetPosition);
                    }
                }
            }
        }

        // se a fila em que a peça se encontra for menor do que 3 do POV do utilizador (1a e 2a do POV do AI), 
        // a peça tem oportunidade de saltar para a fila de baixo do POV do AI (cima do POV do utilizador)
        if (currentRow < 3) {

            // verificamos se essa posição não está ocupada por uma peça do próprio utilizador
            if (game.getBoard().isPositionFree(targetPosition) || game.getBoard().getPieceOnPosition(targetPosition).getOwner() != currentPlayer) {
                targetPositions.push(targetPosition);
            }
        }
    }

    return targetPositions;
}

function getUserValidPiecesToMove() {
    // retorna uma lista de peças do utilizador que podem ser movidas com base no estado
    // do jogo e no valor do latestDiceValue 
    let userPiecesOnBoard = [];

    for (let i = 0; i < 4 * boardColumns; i++) {
        let piece = game.getBoard().getPieceOnPosition(i);
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
    // troca o ecrã / painél transitório visível
    let screenToShow = document.getElementById(elementId);
    currentVisibleScreen.style.display = "none";
    screenToShow.style.display = "flex";
    currentVisibleScreen = screenToShow;
}

function rollDice() {
    let value = 0;

    disableRollDiceButton(); // previne que o jogador lance os dados novamente

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

    // se for o turno do utilizador, verificamos se este tem jogadas disponiveis ou se pode repetir o lançamento dos
    // dados. Este segmento serve para ativar os butões PassTurn e Roll Dices consoante as opções do utilizador.
    if (currentPlayer == "Player1") { 
        let userValidPiecesToMoveList = getUserValidPiecesToMove();

        if (userValidPiecesToMoveList.length > 0) {
            disablePassTurnButton();
        } else {
            if (latestDiceValue == 4 || latestDiceValue == 6) {
                console.log("User can roll dice again");
                addNewMessage(currentPlayer + " it's your turn, please roll the dice");
                disablePassTurnButton();

                setTimeout(() => {
                    resetDice();
                    enableRollDiceButton();
                }, 1000);
            } else {
                console.log("User has no available moves, enabling PassTurn button")
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

function resetDice() {
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
    resetDice();
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
    document.getElementById("player2").innerHTML = player2Wins;
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

    resetDice();
    show("playScreen");

    console.clear();
    console.log("\n\n--------------------------------- SETTINGS UPDATED ----------------------------------\n")
    console.log(game);
    console.log("Playing against: " + opponent);
    console.log("Rolls dice first: " + whoRollsDiceFirst);
    console.log("AI Level: " + aiDifficultyLevel);
    console.log("------------------------------------------------------------\n\n")
}

function addNewMessage(message) {
    // adicionar mensagem à secção de mensagens do lado esquerdo
    const list = document.getElementById("messagesList");
    const li = document.createElement("li");
    li.textContent = message;
    li.classList.add("new-message");

    if (currentPlayer == "Player1") {
        li.classList.add("player1");
    } else {
        li.classList.add("ai");
    }

    list.insertBefore(li, list.firstChild);

    setTimeout(() => {
        li.classList.remove("new-message")
    }, 2000);
}

function clearMessages() {
    // limpa secção de mensagens
    const list = document.getElementById("messagesList");
    list.innerHTML = "";
}

function toggleNumbers() {
    // faz aparecer no tabuleiro o número das posições
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
