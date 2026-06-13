const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const roomCode = {};
const roomLanguage = {};
const roomUsers = {};
const roomChats = {};

const updateUsers = (roomId) => {
  const users = roomUsers[roomId] || [];
  io.to(roomId).emit("users-count", users.length);
};

io.on("connection", (socket) => {
  let currentRoom = "";
  let currentUser = "";

  socket.on("join-room", ({ roomId, username }) => {
    if (!roomId || !username) return;

    currentRoom = roomId;
    currentUser = username;

    socket.join(roomId);

    if (!roomUsers[roomId]) roomUsers[roomId] = [];
    roomUsers[roomId].push({ id: socket.id, username });

    if (!roomChats[roomId]) roomChats[roomId] = [];

    // send previous chat
    socket.emit("load-chat", roomChats[roomId]);

    socket.emit("load-code", roomCode[roomId] || "// Start typing here...");
    socket.emit("load-language", roomLanguage[roomId] || "javascript");

    updateUsers(roomId);

    console.log(`${username} joined ${roomId}`);
  });

  socket.on("send-text", (data) => {
    if (!currentRoom) return;

    roomCode[currentRoom] = data;

    socket.to(currentRoom).emit("receive-text", {
      data,
      senderId: socket.id,
    });
  });

  // ✅ CHAT FIXED VERSION
  socket.on("send-message", (message) => {
    if (!currentRoom) return;
    if (!message) return;

    const chatMessage = {
      username: currentUser,
      text: message,
      time: new Date().toLocaleTimeString(),
    };

    if (!roomChats[currentRoom]) roomChats[currentRoom] = [];

    roomChats[currentRoom].push(chatMessage);

    io.to(currentRoom).emit("receive-message", chatMessage);
  });

  socket.on("change-language", (language) => {
    if (!currentRoom) return;

    roomLanguage[currentRoom] = language;
    io.to(currentRoom).emit("language-changed", language);
  });

  socket.on("disconnect", () => {
    if (!currentRoom) return;

    if (roomUsers[currentRoom]) {
      roomUsers[currentRoom] = roomUsers[currentRoom].filter(
        (u) => u.id !== socket.id
      );
    }

    updateUsers(currentRoom);
  });
});

server.listen(8000, () => {
  console.log("Server running on port 8000");
});