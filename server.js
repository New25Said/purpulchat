const express = require("express");
const fs = require("fs");

const app = express();
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
    }

    saveDB(db);
    res.json({ ok: true });
});

/* ================= MESSAGE ================= */
app.post("/msg", (req, res) => {
    const db = loadDB();

    db.messages.push({
        user: req.body.user,
        text: req.body.text,
        t: Date.now()
    });

    // limitar memoria (IMPORTANTE PARA LAG)
    if (db.messages.length > 200) {
        db.messages = db.messages.slice(-200);
    }

    saveDB(db);

    res.json({ ok: true });
});

/* ================= GET MESSAGES ================= */
app.get("/msgs", (req, res) => {
    const db = loadDB();
    res.json(db.messages);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🍇 Purpul Chat NO FIREBASE RUNNING");
});
