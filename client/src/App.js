import { useContext } from 'react';
import GameWindow from './components/game_window/GameWindow';
import { WalletContext } from './context/WalletContext';
import './App.css';

function App() {
  const { provider } = useContext(WalletContext);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Smart Battleship</h1>
      </header>
      {provider ? (
          <div className='App-window'>
              <GameWindow />
          </div>
        ) : (
          <p>Please install Metamask to play the game.</p>
      )}
    </div>
  );

}

export default App;
