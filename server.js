const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
app.use(express.static("public"));

const DB_FILE = "./data.json";

function loadDB() {
    return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(db) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

/* ================= USERS ================= */
app.post("/user", (req, res) => {
    const db = loadDB();
    const { id } = req.body;

    if (!db.users[id]) {
        db.users[id] = { createdAt: Date.now() };
        saveDB(db);
    }

    res.json({ ok: true });
});

/* ================= WS STATE ================= */
const onlineUsers = new Map(); // user -> ws

function broadcastUsers() {
    const list = [...onlineUsers.keys()];

    const payload = JSON.stringify({
        type: "users",
        users: list
    });

    onlineUsers.forEach(ws => {
        if (ws.readyState === 1) ws.send(payload);
    });
}

/* ================= WS ================= */
wss.on("connection", (ws) => {

    let currentUser = null;

    ws.on("message", (raw) => {
        const msg = JSON.parse(raw);

        /* LOGIN WS */
        if (msg.type === "join") {
            currentUser = msg.user;
            onlineUsers.set(currentUser, ws);
            broadcastUsers();
            return;
        }

        /* GLOBAL MESSAGE */
        if (msg.type === "global") {
            const data = {
                type: "global",
                user: msg.user,
                text: msg.text,
                t: Date.now()
            };

            onlineUsers.forEach(client => {
                if (client.readyState === 1) {
                    client.send(JSON.stringify(data));
                }
            });
        }

        /* PRIVATE MESSAGE */
        if (msg.type === "private") {
            const target = onlineUsers.get(msg.to);

            const payload = {
                type: "private",
                from: msg.user,
                to: msg.to,
                text: msg.text,
                t: Date.now()
            };

            if (target && target.readyState === 1) {
                target.send(JSON.stringify(payload));
            }

            ws.send(JSON.stringify(payload));
        }
    });

    ws.on("close", () => {
        if (currentUser) {
            onlineUsers.delete(currentUser);
            broadcastUsers();
        }
    });
});

server.listen(process.env.PORT || 3000, () => {
    console.log("🍇 Purpul Chat PRIVATE PRO RUNNING");
});
