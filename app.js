import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Rules from './components/Rules';
import Lobby from './components/Lobby';
import Game from './components/Game';
import GameOver from './components/GameOver';

const socket = io.connect('http://localhost:3001');

function App() {
  const [screen, setScreen] = useState('rules');
  const [players, setPlayers] = useState([]);
  const [playerId, setPlayerId] = useState('');
  const [gameData, setGameData] = useState({
    correct: null,
    guesses: [],
    score: 0,
    isAlive: true
  });

  useEffect(() => {
    socket.on('connect', () => setPlayerId(socket.id));

    socket.on('lobbyUpdate', (players) => {
      setPlayers(players);
      setScreen('lobby');
    });

    socket.on('gameStart', () => setScreen('game'));

    socket.on('newRound', (correct) => {
      setGameData(prev => ({
        ...prev,
        correct,
        guesses: []
      }));
    });

    socket.on('roundResult', (data) => {
      const player = data.players.find(p => p.id === playerId);
      setGameData({
        correct: data.correct,
        guesses: data.guesses,
        score: player.score,
        isAlive: player.isAlive
      });
      
      if (!player.isAlive) setScreen('gameOver');
    });

    return () => {
      socket.off();
    };
  }, []);

  return (
    <div className="app">
      {screen === 'rules' && <Rules onJoin={() => setScreen('join')} />}
      {screen === 'join' && (
        <form onSubmit={(e) => {
          e.preventDefault();
          socket.emit('join', e.target.username.value);
        }}>
          <input name="username" placeholder="Enter username" required />
          <button type="submit">Join Game</button>
        </form>
      )}
      {screen === 'lobby' && <Lobby players={players} />}
      {screen === 'game' && gameData.isAlive && (
        <Game
          onSubmit={(guess) => socket.emit('submitGuess', guess)}
          score={gameData.score}
        />
      )}
      {screen === 'gameOver' && <GameOver score={gameData.score} />}
    </div>
  );
}

export default App;