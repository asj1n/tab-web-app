const http = require("http");
const fs = require("fs");
const crypto = require("crypto");
const url = require("url")

const PORT = 8140;
const USERS_FILE = "users.json";
const RANKINGS_FILE = "rankings.json";

// Temporary storage for each game's connected clients
const gameClients = {};  // { gameId: [response, response] }

// Pending and OnGoing Game Maps
const onGoingGamesMap = new Map();
const pendingGamesMap = new Map();

// Ensure the users file exists
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2));
}

// Ensure the rankings file exists
if (!fs.existsSync(RANKINGS_FILE)) {
    fs.writeFileSync(RANKINGS_FILE, JSON.stringify({}, null, 2));
}

class Piece {
    constructor(color) {
        this.color = color;
        this.inMotion = false;
        this.reachedLastRow = false;
    }
}

class Game {
    constructor(group, size, player1Nick) {
        this.player1Nick = player1Nick;
        this.turn = player1Nick;
        this.player2Nick = null;
        this.group = group;
        this.size = size;
        this.winner = null;
        this.pieces = [];
        this.createdAt = new Date();
        this.latestDiceValue = 0;
        this.bluePiecesLeft = this.size;
        this.redPiecesLeft = this.size;
        this.pieceIdWithTwoAlternatives = null;
        this.pieceAlternatives = null;
        this.gameID = this.generateGameID();
        this.players = {
            [this.player1Nick]: "Blue",
            [this.player2Nick]: "Red"
        }
    }

    generateGameID() {
        const hashInput = JSON.stringify({
            group: this.group,
            size: this.size,
            createdAt: this.createdAt
        });

        return crypto.createHash('md5').update(hashInput).digest('hex');
    } 

    getRedPiecesOnBoard() {
        let redPiecesMap = new Map();

        for (let i = 0; i < this.pieces.length; i++) {
            let piece = this.pieces[i]; 
            if (piece?.color == "Red") {
                redPiecesMap.set(i, piece);
            }
        }

        return redPiecesMap;
    }
    
    getRedValidPiecesToMove() {
        let redPiecesOnBoardMap = this.getRedPiecesOnBoard();
        let redValidPiecesToMoveMap = new Map();

        for (const pieceIndex of redPiecesOnBoardMap.keys()) {
            const piece = redPiecesOnBoardMap.get(pieceIndex);
            let pieceTargetPositions = this.getRedPieceTargetPositions(pieceIndex, piece);

            if (pieceTargetPositions.length > 0) {
                redValidPiecesToMoveMap.set(pieceIndex, piece);
            }
        }

        return redValidPiecesToMoveMap;
    }

    getRedPieceTargetPositions(pieceIndex, piece) {
        let boardColumns = this.size;
        let targetPositions = [];
        let currentRow = Math.floor(pieceIndex / boardColumns) + 1;
        let targetPosition = pieceIndex + this.latestDiceValue;
        let targetRow = Math.floor(targetPosition / boardColumns) + 1;

        let currentPlayer = this.players[this.turn];

        if (currentRow == 1) {
            for (let i = 3 * boardColumns; i < 4 * boardColumns; i++) {
                if (this.pieces[i]?.colour == "Red") {
                    return targetPositions;
                }
            }
        }

        if (currentRow == targetRow) { 
            if (this.pieces[targetPosition] == null || this.pieces[targetPosition].color != currentPlayer) {
                if (piece.inMotion == false && this.latestDiceValue == 1 || (piece.inMotion == true)) {
                    targetPositions.push(targetPosition);
                }
            }
        } else { 
            if (currentRow != 1) {
                let rowEndPosition = (currentRow) * boardColumns - 1;
                let stepsToReachRowEnd = rowEndPosition - pieceIndex;
                let secondTargetPosition = rowEndPosition - (2 * boardColumns - 1) + (this.latestDiceValue - (stepsToReachRowEnd + 1)); 
                
                if (this.pieces[secondTargetPosition] == null || this.pieces[secondTargetPosition].color != currentPlayer) {
                    if (!(piece.reachedLastRow == true && currentRow == 2)) {
                        if (piece.inMotion == false && this.latestDiceValue == 1 || (piece.inMotion == true)) {
                            targetPositions.push(secondTargetPosition);
                        }
                    }
                }
            }

            if (currentRow < 3) {
                if (this.pieces[targetPosition] == null || this.pieces[targetPosition].color != currentPlayer) {
                    targetPositions.push(targetPosition);
                }
            }
        }

        return targetPositions;
    }

    getBluePiecesOnBoard() {
        let bluePiecesMap = new Map();

        for (let i = 0; i < this.pieces.length; i++) {
            let piece = this.pieces[i]; 
            if (piece?.color == "Blue") {
                bluePiecesMap.set(i, piece);
            }
        }

        return bluePiecesMap;
    }

    getBlueValidPiecesToMove() {
        let bluePiecesOnBoardMap = this.getBluePiecesOnBoard();
        let blueValidPiecesToMoveMap = new Map();

        for (const pieceIndex of bluePiecesOnBoardMap.keys()) {
            const piece = bluePiecesOnBoardMap.get(pieceIndex);
            let pieceTargetPositions = this.getBluePieceTargetPositions(pieceIndex, piece);

            if (pieceTargetPositions.length > 0) {
                blueValidPiecesToMoveMap.set(pieceIndex, piece);
            }
        }

        return blueValidPiecesToMoveMap;
    }

    getBluePieceTargetPositions(pieceIndex, piece) {
        let boardColumns = this.size;
        let targetPositions = [];
        let currentRow = Math.floor(pieceIndex / boardColumns) + 1;
        let targetPosition = pieceIndex + this.latestDiceValue;
        let targetRow = Math.floor(targetPosition / boardColumns) + 1;

        let currentPlayer = this.players[this.turn];
        // console.log("GetBlueTargetPositions: " + currentPlayer);
 
        if (currentRow == 4) {
            for (let i = 0; i < boardColumns; i++) {
                if (this.pieces[i]?.color == "Blue") {
                    return targetPositions;
                }
            }
        }

        if (currentRow == targetRow) {
            if (this.pieces[targetPosition] == null || this.pieces[targetPosition].color != currentPlayer) {
                if ((piece.inMotion == false && this.latestDiceValue == 1) || piece.inMotion == true) {
                    targetPositions.push(targetPosition);
                }
            }
        } else { 
            if (currentRow > 2) { 
                let rowEndPosition = (currentRow) * boardColumns - 1;
                let stepsToReachRowEnd = rowEndPosition - pieceIndex;
                let secondTargetPosition = rowEndPosition - (2 * boardColumns - 1) + (this.latestDiceValue - (stepsToReachRowEnd + 1)); 
                
                if (this.pieces[secondTargetPosition] == null || this.pieces[secondTargetPosition].color != currentPlayer) {
                    targetPositions.push(secondTargetPosition);
                }
            }

            if (currentRow != 4) {
                if (this.pieces[targetPosition] == null || this.pieces[targetPosition].color != currentPlayer) {
                    if (!(piece.reachedLastRow == true && currentRow == 3)) {
                        if (piece.inMotion == true || (piece.inMotion == false && this.latestDiceValue == 1)) {
                            targetPositions.push(targetPosition);
                        }
                    }
                }
            }
        }

        return targetPositions;
    }

    movePiece(selectedPieceId, targetPositionId) {
        let piece = this.pieces[selectedPieceId];
        let targetPiece = this.pieces[targetPositionId];

        this.pieces[targetPositionId] = piece;
        this.pieces[selectedPieceId] = null;

        let positionRow = Math.floor(targetPositionId / this.size) + 1;
        if (!piece.reachedLastRow) {
            if (!piece.inMotion) {
                piece.inMotion = true;
            } else if (positionRow == 4 && piece.color == "Blue") {
                piece.reachedLastRow = true;
            } else if (positionRow == 1 && piece.color == "Red") {
                piece.reachedLastRow = true;
            }
        }

        if (targetPiece != null) {
            this.updateRemainingPieces(targetPiece);
        }

        return targetPiece;
    }

    updateRemainingPieces(piece) {
        if (piece != null) {
            if (piece.color == "Blue") {
                // console.log("Blue has lost a piece!");
                this.bluePiecesLeft--;
            } else {
                // console.log("Red has lost a piece!");
                this.redPiecesLeft--;
            }
        }
    }

    changeTurn() {
        if (this.turn == this.player1Nick) {
            this.turn = this.player2Nick;
        } else {
            this.turn = this.player1Nick;
        }
    }

    isGameFinished() {
        return this.bluePiecesLeft == 0 || this.redPiecesLeft == 0; 
    }
}

class Message {
    constructor(opts = {}) {
        Object.entries(opts).forEach(([key, value]) => {
            this[key] = value;
        });
    }
}

function sendUpdateMessage(gameId, message) {
    const clients = gameClients[gameId];
    if (!clients) return;

    for (const client of clients) {
        client.write(`data: ${JSON.stringify(message)}\n\n`);
    }
}

const server = http.createServer((request, response) => {
    response.setHeader("Content-Type", "application/json");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST");
    response.setHeader("Access-Control-Allow-Origin", "*");

    const parsed = url.parse(request.url, true);

    if (request.method === "GET" && parsed.pathname === "/update") {

        const nick = parsed.query.nick;
        const gameId = parsed.query.game;

        if (!nick || !gameId) {
            response.writeHead(400);
            response.end(JSON.stringify({ error: `Game or nick missing` }));
            return;
        }

        // Check if game exists in onGoingGames or pendingGames
        if (!onGoingGamesMap.has(gameId)) {

            let pendingGameFound = false;
            for (const key of pendingGamesMap.keys()){
                let pendingGame = pendingGamesMap.get(key);
                if (pendingGame.gameID == gameId) {
                    pendingGameFound = true;
                    break;
                }
            }

            if (!pendingGameFound) {
                response.writeHead(400);
                response.end(JSON.stringify({ error: `GameID: ${gameId} does not exist` }));
                return;
            }
        }

        // ServerSentEvent headers
        response.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        });

        // Add this client for /update notifications
        if (!gameClients[gameId]) gameClients[gameId] = [];
        gameClients[gameId].push(response);

        // console.log(`\nSSE connected: ${nick} in game ${gameId}`);

        // When the client disconnects
        request.on("close", () => {
            // console.log(`\nSSE disconnected: ${nick} from game ${gameId}`);

            const clients = gameClients[gameId];
            if (!clients) return; // Game might already be deleted

            // Remove this client
            gameClients[gameId] = clients.filter(r => r !== response);

            // If no clients left, delete the game entry
            if (gameClients[gameId].length === 0) {
                delete gameClients[gameId];
                // console.log(`No more clients in game ${gameId}, removed SSE group`);
            }
        });

        return;
    }
    
    if (request.method !== "POST") {
        response.writeHead(400);
        response.end(JSON.stringify({ error: "Unknown GET Request" }));
        return;
    }

    switch (request.url) {
        case "/register":
            handleRegister(request, response);
            break;
        
        case "/join":
            handleJoin(request, response);
            break;
        
        case "/leave":
            handleLeave(request, response);
            break;

        case "/roll":
            handleRoll(request, response);
            break;

        case "/ranking":
            handleRanking(request, response);
            break;

        case "/notify":
            handleNotify(request, response);
            break;

        case "/pass":
            handlePass(request, response);
            break;

        default:
            response.statusCode = 404;
            response.end(JSON.stringify({ error: "Unknown request" }));
    }
});

server.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});

function handleRegister(request, response) {
    let body = "";

    request.on("data", chunk => (body += chunk));
    request.on("end", () => {
        let data;
        try {
            data = JSON.parse(body);
        } catch {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "Invalid JSON" }));
        }

        const nick = data.nick;
        const password = data.password;

        if (nick == null) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "nick is undefined" }));
        } 

        if (!isString(nick)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "nick is not a valid string" }));
        }

        if (password == null) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "password is undefined" }));
        }

        if (!isString(password)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "password is not a valid string" }));
        }

        const hashedPassword = hashPassword(password);

        // Load users file
        const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));

        // Check existing user
        if (users[nick]) {
            if (users[nick] !== hashedPassword) {
                response.statusCode = 400;
                return response.end(JSON.stringify({ error: "User registered with a different password" }));
            }
        } else {
            // Save new user
            // console.log("New User: " + nick + ": " + password);
            users[nick] = hashedPassword;
            fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        }
    
        response.end(JSON.stringify({}));
    });
}

function handleRanking(request, response) {
    let body = "";

    request.on("data", chunk => (body += chunk));
    request.on("end", () => {
        let data;
        try {
            data = JSON.parse(body);
        } catch {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "Invalid JSON" }));
        }

        const group = data.group;
        const size = data.size;

        if (group == null) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "undefined group" }));
        } 

        if (!isInteger(group)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "invalid group '" + group + "'" }));
        }

        if (size == null) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "undefined size" }));
        }

        if (!isInteger(size)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "invalid size '" + size + "'" }));
        }

        // Load rankings
        const rankings = JSON.parse(fs.readFileSync(RANKINGS_FILE, "utf8"));

        // Get the ranking array for the group/size, or an empty array if it doesn't exist
        const rankingArray = (rankings[group] && rankings[group][size]) ? rankings[group][size] : [];

        // Respond with desired format
        // console.log("\nSending /rankings response", rankingArray)
        response.end(JSON.stringify({ ranking: rankingArray }));
    });
}

function handleJoin(request, response) {
    let body = "";

    request.on("data", chunk => (body += chunk));
    request.on("end", () => {
        let data;
        try {
            data = JSON.parse(body);
        } catch {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "Invalid JSON" }));
        }

        const group = data.group;
        const nick = data.nick;
        const password = data.password;
        const size = data.size;

        const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));

        if (group == null) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "group is undefined" }));
        }

        if (!isInteger(group)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "invalid group" }));
        }

        if (nick == null) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "nick is undefined" }));
        } 

        if (!isString(nick)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "nick is not a valid string" }));
        }

        if (password == null) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "password is undefined" }));
        }

        if (!isString(password)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "password is not a valid string" }));
        }
        
        if (size == null) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "size is undefined" }));
        }

        if (!isInteger(size) || size % 2 == 0) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "invalid size" }));
        }
        
        if (!users[nick]) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "User is not registered" }));
        }

        if (users[nick] != hashPassword(password)) {
            response.statusCode = 401;
            return response.end(JSON.stringify({ error: "User registered with a different password" }));
        }

        let key = group + ":" + size;
        let gameID;

        if (!pendingGamesMap.has(key)) {
            let newPendingGame = new Game(group, size, nick);
            gameID = newPendingGame.gameID;
            pendingGamesMap.set(key, newPendingGame); 
            // console.log("\nCreating game and adding to pending list: " + JSON.stringify(newPendingGame))
        } else {
            let game = pendingGamesMap.get(key);
            gameID = game.gameID;

            if (game.player1Nick != nick) {
                game.player2Nick = nick;
                // console.log("\nMatched Game: " + JSON.stringify(game));
                onGoingGamesMap.set(gameID, game);
                pendingGamesMap.delete(key);
                // Start game board and send first /update
                startGame(game);
            } else {
                response.statusCode = 400;
                return response.end(JSON.stringify({ error: nick + " is already in queue" }));
            }
        }

        return response.end(JSON.stringify({ game: gameID }));
    });
}

function handleLeave(request, response) {
    let body = "";

    request.on("data", chunk => (body += chunk));
    request.on("end", () => {
        let data;
        try {
            data = JSON.parse(body);
        } catch {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "Invalid JSON" }));
        }
        const nick = data.nick;
        const password = data.password;
        const game = data.game;  

        const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));

        if (nick == null) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "nick is undefined" }));
        } 

        if (!isString(nick)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "nick is not a valid string" }));
        }

        if (password == null) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "password is undefined" }));
        }

        if (!isString(password)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "password is not a valid string" }));
        }

        if (game == null) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "game is undefined" }));
        }

        if (!isString(game)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "game is not a valid string" }));
        }

        if (!users[nick]) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "User is not registered" }));
        }

        if (users[nick] != hashPassword(password)) {
            response.statusCode = 401;
            return response.end(JSON.stringify({ error: "User registered with a different password" }));
        }

        // console.log("Pending Queue: " + pendingGamesMap.size);
        // console.log("OnGoing Games: " + onGoingGamesMap.size);

        if (onGoingGamesMap.has(game)) {
            let onGoingGame = onGoingGamesMap.get(game);
            onGoingGame.winner = nick == onGoingGame.player1Nick ? onGoingGame.player2Nick : onGoingGame.player1Nick;
            onGoingGamesMap.delete(game);
            // console.log("The Game was ongoing and the user: " + nick + " has forfeit. Winner is " + onGoingGame.winner);
            // Finish game and /update needs to send winner: onGoingGame.winner
            endGame(onGoingGame);

            return response.end(JSON.stringify({}));
        }

        for (const key of pendingGamesMap.keys()) {
            let pendingGame = pendingGamesMap.get(key);

            if (pendingGame.player1Nick == nick && pendingGame.gameID == game) {
                pendingGamesMap.delete(key);
                pendingGame.winner = null;
                // console.log("The user: " + nick + " has left the queue. Winner is " + pendingGame.winner);
                // Finish game and /update needs to send winner: null
                endGame(pendingGame);

                return response.end(JSON.stringify({}));
            }
        }       

        response.statusCode = 400;
        return response.end(JSON.stringify({ error: "Invalid Game: " + game }));
    });
}

function handleRoll(request, response) {
    let body = "";

    request.on("data", chunk => (body += chunk));
    request.on("end", () => {
        let data;

        try {
            data = JSON.parse(body);
        } catch {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "Invalid JSON" }));
        }

        const nick = data.nick;
        const password = data.password;
        const game = data.game;  

        const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));

        if (nick == null) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "nick is undefined" }));
        } 

        if (!isString(nick)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "nick is not a valid string" }));
        }

        if (password == null) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "password is undefined" }));
        }

        if (!isString(password)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "password is not a valid string" }));
        }

        if (game == null) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "game is undefined" }));
        }

        if (!isString(game)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "game is not a valid string" }));
        }

        if (!users[nick]) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "User is not registered" }));
        }

        if (users[nick] != hashPassword(password)) {
            response.statusCode = 401;
            return response.end(JSON.stringify({ error: "User registered with a different password" }));
        }

        if (!onGoingGamesMap.has(game)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "game: " + game + " doesn't exist" }));
        }

        const onGoingGame = onGoingGamesMap.get(game);

        if (onGoingGame.player1Nick != nick && onGoingGame.player2Nick != nick) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: nick + "isn't a player in this game" }));
        }

        if (onGoingGame.turn != nick) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "Not your turn to play" }));
        }

        // Needs to generate dice and send /update message with value
        rollDice(onGoingGame);   

        return response.end(JSON.stringify({}));
    });
}

function handleNotify(request, response) {
    let body = "";

    request.on("data", chunk => (body += chunk));
    request.on("end", () => {
        let data;

        try {
            data = JSON.parse(body);
        } catch {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "Invalid JSON" }));
        }

        const nick = data.nick;
        const password = data.password;
        const game = data.game;  
        const cell = data.cell;

        const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));

        if (nick == null) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "nick is undefined" }));
        } 

        if (!isString(nick)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "nick is not a valid string" }));
        }

        if (password == null) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "password is undefined" }));
        }

        if (!isString(password)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "password is not a valid string" }));
        }

        if (game == null) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "game is undefined" }));
        }

        if (!isString(game)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "game is not a valid string" }));
        }

        if (cell == null) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "cell is undefined" }));
        }

        if (!isInteger(cell)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "cell is not a valid integer" }));
        }

        if (!users[nick]) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "User is not registered" }));
        }

        if (users[nick] != hashPassword(password)) {
            response.statusCode = 401;
            return response.end(JSON.stringify({ error: "User registered with a different password" }));
        }

        if (!onGoingGamesMap.has(game)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "game: " + game + " doesn't exist" }));
        }

        const onGoingGame = onGoingGamesMap.get(game);

        if (onGoingGame.player1Nick != nick && onGoingGame.player2Nick != nick) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: nick + "isn't a player in this game" }));
        }

        if (onGoingGame.turn != nick) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "Not your turn to play" }));
        }

        // Needs to move the piece dice and send /update message with value
        makeMove(onGoingGame, cell);   

        return response.end(JSON.stringify({}));
    });
}

function handlePass(request, response) {
    let body = "";

    request.on("data", chunk => (body += chunk));
    request.on("end", () => {
        let data;

        try {
            data = JSON.parse(body);
        } catch {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "Invalid JSON" }));
        }

        const nick = data.nick;
        const password = data.password;
        const game = data.game;

        const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));

        if (nick == null) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "nick is undefined" }));
        } 

        if (!isString(nick)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "nick is not a valid string" }));
        }

        if (password == null) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "password is undefined" }));
        }

        if (!isString(password)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "password is not a valid string" }));
        }

        if (game == null) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "game is undefined" }));
        }

        if (!isString(game)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "game is not a valid string" }));
        }

        if (!users[nick]) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "User is not registered" }));
        }

        if (users[nick] != hashPassword(password)) {
            response.statusCode = 401;
            return response.end(JSON.stringify({ error: "User registered with a different password" }));
        }

        if (!onGoingGamesMap.has(game)) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "game: " + game + " doesn't exist" }));
        }

        const onGoingGame = onGoingGamesMap.get(game);

        if (onGoingGame.player1Nick != nick && onGoingGame.player2Nick != nick) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: nick + "isn't a player in this game" }));
        }

        if (onGoingGame.turn != nick) {
            response.statusCode = 400;
            return response.end(JSON.stringify({ error: "Not your turn to play" }));
        }

        // Needs to pass turn and send /update message with new turn
        passTurn(onGoingGame);   

        return response.end(JSON.stringify({}));
    });
}

function isString(v) {
  return typeof v === "string" || v instanceof String;
}

function isInteger(v) {
  return typeof v === "number" && Number.isInteger(v);
}

// Simple SHA-256 hashing
function hashPassword(password) {
    return crypto.createHash("sha256").update(password).digest("hex");
}

function startGame(game) {
    // console.log("Initializing GameID: " + game.gameID);
    let size = game.size;
    
    for (let i = 0; i < 4 * size; i++) {
        if (i < size) {
            game.pieces[i] = new Piece('Blue');
        } else if (3 * size <= i && i <= 4 * size - 1) {
            game.pieces[i] = new Piece('Red');
        } else {
            game.pieces[i] = null;
        }
    }

    game.players = {
        [game.player1Nick]: "Blue",
        [game.player2Nick]: "Red"
    }

    game.turn = game.player1Nick;
    game.initial = game.player1Nick;

    let message = new Message({
        initial: game.initial,
        pieces: game.pieces,
        players: game.players,
        step: "from",
        turn: game.turn
    })

    // console.log("\nSending startGame update message for GameID: " + game.gameID);
    
    setTimeout(() => {
        sendUpdateMessage(game.gameID, message);
    }, 1000)
}

function endGame(game) {
    let message = new Message({
        winner: game.winner
    })

    // Update rankings
    if (game.winner != null) {
        updateRankings(game);
    }

    // console.log("\nSending endGame update message for GameID: " + game.gameID);
    sendUpdateMessage(game.gameID, message);
}

function rollDice(game) {

    let stickValuesArray = [false, false, false, false];
    let totalValue = 0;
    for (let i = 0; i < 4; i++) {
        let random = Math.floor(Math.random() * 2);
        stickValuesArray[i] = random == 1 ? true : false;
        totalValue += random;
    }

    if (totalValue == 0) { totalValue = 6; }

    let hasToRollAgain = false;
    if (totalValue == 1 || totalValue == 4 || totalValue == 6) {
        hasToRollAgain = true;
    }

    let shouldPass = null;
    if (!hasToRollAgain) {
        const validMoves = game.turn === game.player1Nick
            ? game.getBlueValidPiecesToMove()
            : game.getRedValidPiecesToMove();

        if (validMoves.size === 0) {
            shouldPass = game.turn;
        }
    }

    let message = new Message({
        dice: {
            keepPlaying: hasToRollAgain,
            stickValues: stickValuesArray,
            value: totalValue
        },
        mustPass: shouldPass,
        turn: game.turn
    })

    game.latestDiceValue = totalValue;

    // console.log("\nSending rollDice update message for GameID: " + game.gameID);
    sendUpdateMessage(game.gameID, message);
}

function updateRankings(game) {

    const group = game.group;
    const size = game.size;
    const player1Nick = game.player1Nick;
    const player2Nick = game.player2Nick;
    const winner = game.winner;

    const rankings = JSON.parse(fs.readFileSync(RANKINGS_FILE, "utf8"));

    if (!rankings[group]) {
        rankings[group] = {};
    }

    if (!rankings[group][size]) {
        rankings[group][size] = [];
    }

    const list = rankings[group][size];
  
    // ---- Update player 1 ----
    let player1 = list.find(p => p.nick === player1Nick);

    if (!player1) {
        player1 = { nick: player1Nick, victories: 0, games: 0 };
        list.push(player1);
    }

    player1.games++;
    if (player1Nick === winner) {
        player1.victories++;
    }

    // ---- Update player 2 ----
    let player2 = list.find(p => p.nick === player2Nick);

    if (!player2) {
        player2 = { nick: player2Nick, victories: 0, games: 0 };
        list.push(player2);
    }

    player2.games++;
    if (player2Nick === winner) {
        player2.victories++;
    }

    // console.log("\nUpdating Rankings after conclusion of GameID: " + game.gameID);
    fs.writeFileSync(RANKINGS_FILE, JSON.stringify(rankings, null, 2), "utf8");
}

function makeMove(game, chosenCellIndex) {
    
    let currentPlayer = game.turn;
    let selectedPieces;

    if (game.pieceIdWithTwoAlternatives != null) { // Previous notify had two choices
        let from = game.pieceIdWithTwoAlternatives;
        if (!game.pieceAlternatives.includes(chosenCellIndex)) { // Invalid choice
            // console.log("\nChosen alternative is invalid: " + chosenCellIndex)
            sendUpdateInvalidChoiceError(game);
        } else { // Valid Choice
            // console.log("\nValid Chosen alternative! Will move piece: " + from + " to " + chosenCellIndex);
            game.movePiece(from, chosenCellIndex);
            game.pieceAlternatives = null;
            game.pieceIdWithTwoAlternatives = null;
            selectedPieces = [from, chosenCellIndex];
        }
    } 
    else { // "Regular" move (1 option only)
        let piece = game.pieces[chosenCellIndex];

        if (piece == null) {
            // console.log("Selected a null piece")
            return;
        }

        let cellTargetPositions = [];
        if (game.turn == game.player1Nick) {
            // console.log("\nFetching Blue target positions for piece: " + chosenCellIndex)
            cellTargetPositions = game.getBluePieceTargetPositions(chosenCellIndex, piece)
        } else {
            // console.log("\nFetching Red target positions for piece: " + chosenCellIndex)
            cellTargetPositions = game.getRedPieceTargetPositions(chosenCellIndex, piece)
        } 
        
        // console.log("Target Positions found: " + cellTargetPositions);

        if (cellTargetPositions.length == 2) {
            // console.log("\n>>> Need to send step: to message")
            sendUpdateWithTwoAlternatives(game, chosenCellIndex, cellTargetPositions);
            return;
        }

        game.movePiece(chosenCellIndex, cellTargetPositions[0])
        selectedPieces = [chosenCellIndex, cellTargetPositions[0]];
    }

    let hasToRollAgain = false
    if (game.latestDiceValue == 1 || game.latestDiceValue == 4 || game.latestDiceValue == 6) {
        hasToRollAgain = true;
    }

    if (!hasToRollAgain) {
        game.changeTurn();
    }

    // game.players = {
    //     [game.player1Nick]: "Blue",
    //     [game.player2Nick]: "Red"
    // }

    let message = new Message({
        cell: chosenCellIndex,
        dice: null,
        initial: game.player1Nick,
        pieces: game.pieces,
        players: game.players,
        selected: selectedPieces,
        step: "from",
        turn: game.turn
    })

    sendUpdateMessage(game.gameID, message);

    if (game.isGameFinished()) {
        // console.log("\nMove has concluded the game");
        game.winner = currentPlayer;
        endGame(game);
    }
}

function passTurn(game) {
    let currentTurn = game.turn;

    let validMoves;
    if (currentTurn == game.player1Nick) {
        validMoves = game.getBlueValidPiecesToMove();
    } else {
        validMoves = game.getRedValidPiecesToMove();
    }

    // console.log("\nTrying to pass turn. Valid pieces to move: " + [...validMoves]);

    if (validMoves.length == 0) {
        // console.log("\nCant pass turn, player has moves available.");
        return;
    }

    game.changeTurn();
    
    let message = new Message({
        dice: null,
        initial: game.player1Nick,
        pieces: game.pieces,
        players: game.players,
        step: "from",
        turn: game.turn
    })

    // console.log("\nPassing turn from " + currentTurn + " to " + game.turn);
    sendUpdateMessage(game.gameID, message);
}

function sendUpdateWithTwoAlternatives(game, cellIndex, cellAlternatives) {
    //  game.players = {
    //     [game.player1Nick]: "Blue",
    //     [game.player2Nick]: "Red"
    // }
    
    let message = new Message({
        cell: cellIndex,
        dice: null,
        initial: game.player1Nick,
        pieces: game.pieces,
        players: game.players,
        selected: cellAlternatives,
        step: "to",
        turn: game.turn
    })

    game.pieceIdWithTwoAlternatives = cellIndex;
    game.pieceAlternatives = cellAlternatives;

    sendUpdateMessage(game.gameID, message);
}

function sendUpdateInvalidChoiceError(game) {
    let message = new Message({
        error: "Invalid chosen move"
    })

    sendUpdateMessage(game.gameID, message);
}

