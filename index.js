const http = require("http");
const fs = require("fs");
const crypto = require("crypto");

const PORT = 8140;
const USERS_FILE = "users.json";
const RANKINGS_FILE = "rankings.json";

// Ensure the users file exists
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2));
}

// Ensure the rankings file exists
if (!fs.existsSync(RANKINGS_FILE)) {
    fs.writeFileSync(RANKINGS_FILE, JSON.stringify({}, null, 2));
}

const server = http.createServer((request, response) => {
    response.setHeader("Content-Type", "application/json");

    switch (request.url) {
        case "/register":
            handleRegister(request, response);
            break;

        case "/ranking":
            handleRanking(request, response);
            break;
        
        default:
            response.statusCode = 404;
            response.end(JSON.stringify({ error: "Unknown POST request" }));
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
            console.log("New User");
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
