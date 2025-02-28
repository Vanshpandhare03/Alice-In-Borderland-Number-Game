const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let gameState = {
  players: [],
  isGameActive: false,
  currentCorrect: null,
  currentGuesses: new Map(),
  roundNumber: 0
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (username) => {
    if (gameState.players.length >= 5 || gameState.isGameActive) {
      socket.emit('error', 'Game is full or in progress');
      return;
    }

    const player = {
      id: socket.id,
      name: username,
      score: 0,
      isAlive: true
    };
    
    gameState.players.push(player);
    io.emit('lobbyUpdate', gameState.players);

    if (gameState.players.length === 5) {
      startGame();
    }
  });

  socket.on('submitGuess', (guess) => {
    if (!gameState.isGameActive || 
        !gameState.players.find(p => p.id === socket.id && p.isAlive)) return;

    gameState.currentGuesses.set(socket.id, parseInt(guess));
    
    const alivePlayers = gameState.players.filter(p => p.isAlive);
    if (gameState.currentGuesses.size === alivePlayers.length) {
      processRound();
    }
  });

  socket.on('disconnect', () => {
    gameState.players = gameState.players.filter(p => p.id !== socket.id);
    io.emit('lobbyUpdate', gameState.players);
  });

  function startGame() {
    gameState.isGameActive = true;
    gameState.roundNumber = 0;
    gameState.players.forEach(p => p.isAlive = true);
    io.emit('gameStart');
    newRound();
  }

  function newRound() {
    gameState.roundNumber++;
    gameState.currentCorrect = Math.floor(Math.random() * 101);
    gameState.currentGuesses.clear();
    io.emit('newRound', gameState.currentCorrect);
  }

  function processRound() {
    // Calculate distances and determine losers
    const distances = [];
    gameState.currentGuesses.forEach((guess, id) => {
      distances.push({
        player: gameState.players.find(p => p.id === id),
        distance: Math.abs(guess - gameState.currentCorrect)
      });
    });

    const maxDistance = Math.max(...distances.map(d => d.distance));
    const losers = distances.filter(d => d.distance === maxDistance);

    // Update scores
    losers.forEach(loser => {
      loser.player.score -= 1;
      if (loser.player.score <= -10) loser.player.isAlive = false;
    });

    // Check for eliminated players
    const eliminated = gameState.players.filter(p => !p.isAlive && p.score <= -10);
    
    // Broadcast results
    io.emit('roundResult', {
      correct: gameState.currentCorrect,
      guesses: Array.from(gameState.currentGuesses),
      players: gameState.players,
      losers: losers.map(l => l.player.id),
      eliminated: eliminated.map(p => p.id)
    });

    // Check game continuation
    if (gameState.players.filter(p => p.isAlive).length === 0) {
      gameState.isGameActive = false;
      io.emit('gameEnd');
    } else {
      setTimeout(newRound, 5000);
    }
  }
});

server.listen(3001, () => {
  console.log('Server running on port 3001');
});