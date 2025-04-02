const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

let userCount = 0;
let activeUsers = {};
let privateChats = {};

io.on("connection", (socket) => {
    userCount++;
    const username = `Anonymous-user ${userCount}`;
    activeUsers[socket.id] = username;

    io.emit("chat message", `🔵 ${username} has entered the chat`);
    io.emit("update users", Object.values(activeUsers));

    socket.emit("set username", username);

    socket.on("chat message", (msg) => {
        io.emit("chat message", `${username}: ${msg}`);
    });

    socket.on("private message", ({ recipient, message }) => {
        const recipientSocketId = Object.keys(activeUsers).find(key => activeUsers[key] === recipient);

        if (recipientSocketId) {
            const chatKey = [username, recipient].sort().join("-");
            if (!privateChats[chatKey]) privateChats[chatKey] = [];
            privateChats[chatKey].push(`${username}: ${message}`);

            io.to(recipientSocketId).emit("private message", {
                sender: username,
                message: message,
            });
        }
    });

    socket.on("get private history", ({ recipient }) => {
        const chatKey = [username, recipient].sort().join("-");
        socket.emit("private history", { history: privateChats[chatKey] || [] });
    });

    socket.on("disconnect", () => {
        userCount--;
        delete activeUsers[socket.id];
        io.emit("chat message", `🔴 ${username} has left the chat`);
        io.emit("update users", Object.values(activeUsers));
    });
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
