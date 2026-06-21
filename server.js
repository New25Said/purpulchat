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

/* ================= USERS ================= */
app.post("/user", (req, res) => {
    const db = loadDB();

    const { id } = req.body;

    if (!db.users[id]) {
        db.users[id] = {
            createdAt: Date.now()
        };
        saveDB(db);
    }

    res.json({ ok: true });
});

/* ================= WEBSOCKET ================= */
wss.on("connection", (ws) => {

    ws.on("message", (data) => {
        const msg = JSON.parse(data);

        if (msg.type === "msg") {
            const db = loadDB();

            const message = {
                user: msg.user,
                text: msg.text,
                t: Date.now()
            };

            db.messages.push(message);

            if (db.messages.length > 200) {
                db.messages = db.messages.slice(-200);
            }

            saveDB(db);

            // broadcast a todos
            wss.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(JSON.stringify({
                        type: "msg",
                        data: message
                    }));
                }
            });
        }
    });

});

/* ================= LOAD MESSAGES ================= */
app.get("/msgs", (req, res) => {
    const db = loadDB();
    res.json(db.messages);
});

server.listen(process.env.PORT || 3000, () => {
    console.log("🍇 Purpul Chat PRO WS RUNNING");
});
