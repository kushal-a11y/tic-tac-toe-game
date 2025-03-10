const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

app.use(cors());

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    }
});

let rooms = {}; // Store game state for rooms

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("joinRoom", (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);

        if (!rooms[room]) {
            rooms[room] = { board: Array(9).fill(null), players: [], turn: "X" };
        }

        if (rooms[room].players.length < 2) {
            rooms[room].players.push(socket.id);
            const playerSymbol = rooms[room].players.length === 1 ? "X" : "O";
            socket.emit("playerSymbol", playerSymbol);

            if (rooms[room].players.length === 2) {
                io.to(room).emit("matchFound");
            }
        }
        socket.emit("gameState", rooms[room].board);
        socket.emit("turnUpdate", rooms[room].turn);
    });

    socket.on("makeMove", ({ room, index, player }) => {
        if (rooms[room] && rooms[room].board[index] === null) {

            if (rooms[room].turn !== player) {
                return; // Ignore move if it's not their turn
            }

            rooms[room].board[index] = player; // Fix typo: "board" instead of "borad"
            rooms[room].turn = player === "X" ? "O" : "X"; // Switch turn

            io.to(room).emit("gameState", rooms[room].board);
            io.to(room).emit("turnUpdate", rooms[room].turn); // Notify turn change

            // Check for winner
            const winner = checkWinner(rooms[room].board);
            if (winner) {
                io.to(room).emit("gameOver", { winner });
                rooms[room].board = Array(9).fill(null); // Reset board
                rooms[room].turn = "X";
            } else if (!rooms[room].board.includes(null)) {
                io.to(room).emit("gameOver", { winner: "Draw" });
                rooms[room].board = Array(9).fill(null);
                rooms[room].turn = "X";
            }
        }
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        for (let room in rooms) {
            rooms[room].players = rooms[room].players.filter(id => id !== socket.id);
            if (rooms[room].players.length === 0) {
                delete rooms[room];
            }
        }
    });
});

const checkWinner = (board) => {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]  // Diagonals
    ];

    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
};

server.listen(5001, () => console.log("Server running on port 5001"));
