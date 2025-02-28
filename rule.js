function Rules({ onJoin }) {
    return (
      <div className="rules">
        <h1>Number Guessing Game</h1>
        <div className="rules-list">
          <p>• Start with 0 points</p>
          <p>• Each round guess between 0-100</p>
          <p>• Farthest guess loses 1 point</p>
          <p>• Reach -10 points and you die</p>
          <p>• Max 5 players</p>
        </div>
        <button onClick={onJoin}>Join Game</button>
      </div>
    );
  }
  
  export default Rules;