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

/* WS STATE */
const online = new Map(); // user -> ws

function broadcastUsers() {
    const list = [...online.keys()];
    const payload = JSON.stringify({ type: "users", users: list });

    online.forEach(ws => {
        if (ws.readyState === 1) ws.send(payload);
    });
}

wss.on("connection", (ws) => {

    let user = null;

    ws.on("message", (raw) => {
        const msg = JSON.parse(raw);

        /* LOGIN */
        if (msg.type === "join") {
            user = msg.user;
            online.set(user, ws);
            broadcastUsers();
            return;
        }

        /* GLOBAL MESSAGE */
        if (msg.type === "global") {
            const db = loadDB();

            const m = {
                user: msg.user,
                text: msg.text,
                t: Date.now()
            };

            db.messages.push(m);
            if (db.messages.length > 300) db.messages = db.messages.slice(-300);
            saveDB(db);

            online.forEach(c => {
                if (c.readyState === 1) {
                    c.send(JSON.stringify({ type: "global", data: m }));
                }
            });
        }

        /* PRIVATE MESSAGE */
        if (msg.type === "private") {
            const payload = {
                type: "private",
                from: msg.user,
                to: msg.to,
                text: msg.text,
                t: Date.now()
            };

            const target = online.get(msg.to);

            if (target) target.send(JSON.stringify(payload));
            ws.send(JSON.stringify(payload));
        }
    });

    ws.on("close", () => {
        if (user) {
            online.delete(user);
            broadcastUsers();
        }
    });
});

/* HISTORY */
app.get("/msgs", (req, res) => {
    const db = loadDB();
    res.json(db.messages);
});

server.listen(3000, () => {
    console.log("🍇 Purpul Chat FIXED CORE RUNNING");
});
