import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:5001");

const App = () => {
    const [board, setBoard] = useState(Array(9).fill(null));
    const [player, setPlayer] = useState("");
    const [room, setRoom] = useState("");
    const [turn, setTurn] = useState("X");
    const [winChances, setWinChances] = useState({ X: 50, O: 50 });

    useEffect(() => {
        socket.on("gameState", (newBoard) => {
            setBoard(newBoard);
            updateWinChances(newBoard);
        });

        socket.on("playerSymbol", (symbol) => {
            setPlayer(symbol);
        });

        socket.on("matchFound", () => {
            alert("Match found! Game starting...");
        });

        socket.on("turnUpdate", (nextTurn) => {
            setTurn(nextTurn);
        });

        socket.on("gameOver", ({ winner }) => {
            alert(winner === "Draw" ? "It's a draw!" : `${winner} wins!`);
            setBoard(Array(9).fill(null));
            setTurn("X");
        });

        return () => socket.off();
    }, []);

    const joinGame = () => {
        if (room) {
            socket.emit("joinRoom", room);
        }
    };

    const handleClick = (index) => {
        if (board[index] || turn !== player) {
            return;
        }
        socket.emit("makeMove", { room, index, player });
    };

    const updateWinChances = (board) => {
        let xCount = board.filter(cell => cell === "X").length;
        let oCount = board.filter(cell => cell === "O").length;
        let totalMoves = xCount + oCount;

        let xChance = totalMoves === 0 ? 50 : Math.max(10, 100 - xCount * 10);
        let oChance = totalMoves === 0 ? 50 : Math.max(10, 100 - oCount * 10);

        setWinChances({ X: xChance, O: oChance });
    };

    return (
        <div className="game-container">
            <div className="game-area">
                <h1>Tic Tac Toe</h1>
                <input 
                    type="text" 
                    placeholder="Enter Room ID" 
                    value={room} 
                    onChange={(e) => setRoom(e.target.value)} 
                    className="room-input"
                />
                <button className="join-btn" onClick={joinGame}>Join Room</button>
                <h2>{player ? `You are: ${player}` : "Waiting for player..."}</h2>
                <h3>{`Current Turn: ${turn}`}</h3>            
                <div className="board">
                    {board.map((cell, index) => (
                        <div 
                            key={index} 
                            className={`tile ${cell === "X" ? "tile-x" : cell === "O" ? "tile-o" : ""}`} 
                            onClick={() => handleClick(index)}
                        >
                            {cell}
                        </div>
                    ))}
                </div>
            </div>
            <div className="side-panel">
                <h3>Winning Chances</h3>
                <p className="win-x">X: {winChances.X}%</p>
                <p className="win-o">O: {winChances.O}%</p>
            </div>
        </div>
    );
};

export default App;
