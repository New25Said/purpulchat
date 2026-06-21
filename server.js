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

/* USERS */
app.post("/user", async (req, res) => {
  const { id, nickname, photo } = req.body;

  await db.collection("users").doc(id).set({
    nickname,
    photo,
    updatedAt: Date.now()
  }, { merge: true });

  res.json({ ok: true });
});

/* MESSAGE */
app.post("/msg", async (req, res) => {
  const { user, text } = req.body;

  await db.collection("messages").add({
    user,
    text,
    t: Date.now()
  });

  res.json({ ok: true });
});

/* GET MESSAGES */
app.get("/msgs", async (req, res) => {
  const snap = await db.collection("messages")
    .orderBy("t")
    .limit(60)
    .get();

  res.json(snap.docs.map(d => d.data()));
});

/* USER BATCH (MUCHO MÁS RÁPIDO) */
app.post("/usersBatch", async (req, res) => {
  const { ids } = req.body;

  const results = {};

  await Promise.all(ids.map(async (id) => {
    const doc = await db.collection("users").doc(id).get();
    results[id] = doc.exists ? doc.data() : null;
  }));

  res.json(results);
});

app.listen(process.env.PORT || 3000, () =>
  console.log("🍇 Purpul Chat PRO RUNNING")
);
