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

/* =========================
   CREAR USUARIO
========================= */
app.post("/createUser", async (req, res) => {
    try {
        const { user, nickname, photo } = req.body;

        if (!user) throw new Error("User requerido");

        await db.collection("users").doc(user).set({
            nickname: nickname || user,
            photo: photo || "",
            createdAt: Date.now()
        });

        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

/* =========================
   ENVIAR MENSAJE
========================= */
app.post("/sendMessage", async (req, res) => {
    try {
        const { user, text } = req.body;

        if (!user || !text) throw new Error("Datos incompletos");

        await db.collection("messages").add({
            user,
            text,
            timestamp: Date.now()
        });

        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

/* =========================
   TRAER MENSAJES
========================= */
app.get("/messages", async (req, res) => {
    try {
        const snap = await db.collection("messages")
            .orderBy("timestamp")
            .limit(50)
            .get();

        const messages = snap.docs.map(doc => doc.data());

        res.json(messages);
    } catch (err) {
        res.json([]);
    }
});

/* =========================
   TRAER USER
========================= */
app.get("/user/:id", async (req, res) => {
    try {
        const doc = await db.collection("users").doc(req.params.id).get();
        res.json(doc.exists ? doc.data() : null);
    } catch {
        res.json(null);
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🍇 Purpul Chat RUNNING");
});
