const express = require("express");
const fs = require("fs");
const http = require("http");
const { WebSocketServer } = require("ws");

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

/* USERS */
app.post("/user", (req, res) => {
    const db = loadDB();
    const { id } = req.body;

    if (!id) return res.json({ ok: false });

    if (!db.users[id]) {
        db.users[id] = { createdAt: Date.now() };
        saveDB(db);
    }

    res.json({ ok: true });
});

/* WS */
const online = new Map(); // user -> ws

function sendUsers() {
    const list = [...online.keys()];

    const payload = JSON.stringify({
        type: "users",
        users: list
    });

    online.forEach(ws => ws.send(payload));
}

wss.on("connection", (ws) => {

    let currentUser = null;

    ws.on("message", (raw) => {
        const msg = JSON.parse(raw);

        /* LOGIN WS */
        if (msg.type === "join") {
            currentUser = msg.user;
            online.set(currentUser, ws);
            sendUsers();
            return;
        }

        /* GLOBAL */
        if (msg.type === "global") {
            const data = {
                type: "global",
                user: msg.user,
                text: msg.text,
                t: Date.now()
            };

            online.forEach(c => {
                if (c.readyState === 1) {
                    c.send(JSON.stringify(data));
                }
            });
        }

        /* PRIVATE */
        if (msg.type === "private") {
            const target = online.get(msg.to);

            const payload = {
                type: "private",
                from: msg.user,
                to: msg.to,
                text: msg.text,
                t: Date.now()
            };

            if (target) target.send(JSON.stringify(payload));
            ws.send(JSON.stringify(payload));
        }
    });

    ws.on("close", () => {
        if (currentUser) {
            online.delete(currentUser);
            sendUsers();
        }
    });
});

/* HISTORY GLOBAL (opcional simple) */
app.get("/msgs", (req, res) => {
    const db = loadDB();
    res.json(db.messages);
});

server.listen(process.env.PORT || 3000, () => {
    console.log("🍇 Purpul Chat FIXED RUNNING");
});
