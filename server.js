const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const admin = require("firebase-admin");
const bcrypt = require("bcryptjs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let serviceAccount;

try {
    serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT
    );
} catch (err) {
    console.error("FIREBASE_SERVICE_ACCOUNT inválida");
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

io.on("connection", (socket) => {

    console.log("Usuario conectado");

    socket.on("register", async (data, callback) => {

        try {

            const {
                user,
                nickname,
                password,
                photo
            } = data;

            if (
                !user ||
                !nickname ||
                !password
            ) {
                callback({
                    success: false,
                    message: "Datos incompletos"
                });
                return;
            }

            const userRef =
                db.collection("users").doc(user);

            const userDoc =
                await userRef.get();

            if (userDoc.exists) {

                callback({
                    success: false,
                    message: "El usuario ya existe"
                });

                return;
            }

            const passwordHash =
                await bcrypt.hash(password, 10);

            await userRef.set({
                user,
                nickname,
                passwordHash,
                photo: photo || "",
                createdAt: Date.now()
            });

            callback({
                success: true,
                message: "Cuenta creada"
            });

        } catch (err) {

            console.error(err);

            callback({
                success: false,
                message: "Error del servidor"
            });

        }

    });

    socket.on("login", async (data, callback) => {

        try {

            const {
                user,
                password
            } = data;

            const userRef =
                db.collection("users").doc(user);

            const userDoc =
                await userRef.get();

            if (!userDoc.exists) {

                callback({
                    success: false,
                    message: "Usuario no encontrado"
                });

                return;
            }

            const userData =
                userDoc.data();

            const valid =
                await bcrypt.compare(
                    password,
                    userData.passwordHash
                );

            if (!valid) {

                callback({
                    success: false,
                    message: "Contraseña incorrecta"
                });

                return;
            }

            socket.user = user;

            callback({
                success: true,
                profile: {
                    user: userData.user,
                    nickname: userData.nickname,
                    photo: userData.photo
                }
            });

            const messagesSnapshot =
                await db
                    .collection("messages")
                    .orderBy("timestamp", "asc")
                    .limit(100)
                    .get();

            const history = [];

            messagesSnapshot.forEach(doc => {
                history.push(doc.data());
            });

            socket.emit(
                "chatHistory",
                history
            );

        } catch (err) {

            console.error(err);

            callback({
                success: false,
                message: "Error del servidor"
            });

        }

    });

    socket.on("sendMessage", async (text) => {

        try {

            if (!socket.user) return;

            const userDoc =
                await db
                    .collection("users")
                    .doc(socket.user)
                    .get();

            if (!userDoc.exists) return;

            const userData =
                userDoc.data();

            const msg = {
                user: userData.user,
                nickname: userData.nickname,
                photo: userData.photo,
                text,
                timestamp: Date.now()
            };

            await db
                .collection("messages")
                .add(msg);

            io.emit("message", msg);

        } catch (err) {

            console.error(err);

        }

    });

    socket.on("updateProfile", async (data, callback) => {

        try {

            if (!socket.user) {
                callback({
                    success: false
                });
                return;
            }

            const updateData = {};

            if (data.nickname) {
                updateData.nickname =
                    data.nickname;
            }

            if (data.photo) {
                updateData.photo =
                    data.photo;
            }

            await db
                .collection("users")
                .doc(socket.user)
                .update(updateData);

            callback({
                success: true
            });

        } catch (err) {

            console.error(err);

            callback({
                success: false
            });

        }

    });

    socket.on("disconnect", () => {

        console.log(
            "Usuario desconectado"
        );

    });

});

const PORT =
    process.env.PORT || 3000;

server.listen(PORT, () => {

    console.log(
        `Purpul Chat iniciado en puerto ${PORT}`
    );

});
