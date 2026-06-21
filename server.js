const express = require("express");
const admin = require("firebase-admin");

const app = express();

app.use(express.json());
app.use(express.static("public"));

const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

app.post("/test", async (req, res) => {

    try {

        await db.collection("users").doc("test").set({
            createdAt: Date.now()
        });

        res.json({
            success: true
        });

    } catch (err) {

        console.error(err);

        res.json({
            success: false,
            error: err.message
        });

    }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        "Purpul Chat iniciado"
    );

});
