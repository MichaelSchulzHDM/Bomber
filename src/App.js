import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React 
        </a>
      </header>
      <div className="penis">
        <h1>Bomber</h1>
        <p>Welcome to the Bomber game!</p>
        <table>
          <tr>
            <th>Spieler</th>
            <th>Dörfer</th>
            <th>Punkte</th>
            <th>Status</th>
          </tr>
        </table>
      </div>

    </div>
  );
}

export default App;
