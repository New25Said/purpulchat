const express = require("express");
const admin = require("firebase-admin");

const app = express();

app.use(express.json({ limit: "5mb" }));
app.use(express.static("public"));

const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/* ================= USERS ================= */
app.post("/createUser", async (req, res) => {
    try {
        const { user, nickname, photo } = req.body;

        await db.collection("users").doc(user).set({
            nickname,
            photo,
            createdAt: Date.now()
        });

        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

/* ================= MESSAGES ================= */
app.post("/sendMessage", async (req, res) => {
    try {
        const { user, text } = req.body;

        await db.collection("messages").add({
            user,
            text,
            timestamp: Date.now()
        });

        res.json({ success: true });
    } catch (e) {
        res.json({ success: false });
    }
});

app.get("/messages", async (req, res) => {
    try {
        const snap = await db.collection("messages")
            .orderBy("timestamp")
            .limit(50)
            .get();

        res.json(snap.docs.map(d => d.data()));
    } catch {
        res.json([]);
    }
});

app.get("/user/:id", async (req, res) => {
    const doc = await db.collection("users").doc(req.params.id).get();
    res.json(doc.exists ? doc.data() : null);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🍇 Purpul Chat listo");
});
