const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const users = {};
const messages = [];

io.on("connection", (socket) => {

    socket.on("register", (data, callback) => {

        if (users[data.user]) {
            callback({
                success: false,
                message: "User ya existe"
            });
            return;
        }

        users[data.user] = {
            user: data.user,
            nickname: data.nickname,
            photo: data.photo
        };

        callback({
            success: true
        });
    });

    socket.on("login", (user, callback) => {

        if (!users[user]) {
            callback({
                success: false
            });
            return;
        }

        callback({
            success: true,
            profile: users[user]
        });

        socket.user = user;

        socket.emit("chatHistory", messages);
    });

    socket.on("message", (text) => {

        if (!socket.user) return;

        const profile = users[socket.user];

        const msg = {
            nickname: profile.nickname,
            user: profile.user,
            photo: profile.photo,
            text,
            time: Date.now()
        };

        messages.push(msg);

        io.emit("message", msg);
    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Purpul Chat iniciado");
});
