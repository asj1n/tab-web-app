const http = require("http");
const fs = require("fs");
const crypto = require("crypto");

const PORT = 8140;
const USERS_FILE = "users.json";
const RANKINGS_FILE = "rankings.json";

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
        this.gameID = this.generateGameID();
    }

    generateGameID() {
        const hashInput = JSON.stringify({
            group: this.group,
            size: this.size,
            createdAt: this.createdAt
        });

        return crypto.createHash('md5').update(hashInput).digest('hex');
    }    
}

const server = http.createServer((request, response) => {
    response.setHeader("Content-Type", "application/json");

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
            console.log("New User: " + nick + ": " + password);
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
            console.log("Creating game and adding to pending list: " + JSON.stringify(newPendingGame))
        } else {
            let game = pendingGamesMap.get(key);
            gameID = game.gameID;

            if (game.player1Nick != nick) {
                game.player2Nick = nick;
                console.log("Matching game found: " + JSON.stringify(game));
                // Initialize game board for /update
                onGoingGamesMap.set(gameID, game);
                pendingGamesMap.delete(key);
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

        console.log("Pending Queue: " + pendingGamesMap.size);
        console.log("OnGoing Games: " + onGoingGamesMap.size);

        if (onGoingGamesMap.has(game)) {
            let onGoingGame = onGoingGamesMap.get(game);
            onGoingGame.winner = nick == onGoingGame.player1Nick ? onGoingGame.player2Nick : onGoingGame.player1Nick;
            onGoingGamesMap.delete(game);
            console.log("The Game was ongoing and the user: " + nick + " has forfeit. Winner is " + onGoingGame.winner);
            // /update needs to send winner: onGoingGame.winner
            return response.end(JSON.stringify({}));
        }

        for (const key of pendingGamesMap.keys()) {
            let pendingGame = pendingGamesMap.get(key);

            if (pendingGame.player1Nick == nick && pendingGame.gameID == game) {
                pendingGamesMap.delete(key);
                pendingGame.winner = null;
                console.log("The user: " + nick + " has left the queue. Winner is " + pendingGame.winner);
                // /update needs to send winner: null
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
