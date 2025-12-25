import logo from './logo.svg';
import './App.css';
import Button from '@mui/material/Button';

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
        <p><Button variant="contained" onClick={loadData}>Load Data</Button></p>

      </header>
      <table id="dataTable" border="1"></table>
    </div>
  );
}

async function loadData() {
  try {
    const data = await fetch("https://corsproxy.io/?https://de242.die-staemme.de/map/ally.txt")

    const csv = await data.text();
    let myTableArray = csv.split('\n')
    console.log(myTableArray) // --> Test output in console
    let myTable = `<thead><tr><th>
           ${myTableArray[0].replaceAll(',', '<th>')}</tr></thead><tbody>`
    myTableArray.shift()
    myTableArray.forEach((aktRow) => {
      myTable += `<tr><td>${aktRow.replaceAll(
        ',', '<td>')}</tr></tbody>`
    })
    document.querySelector('#dataTable').insertAdjacentHTML('afterBegin', myTable)

  } catch (error) {
    console.error("Error loading data:", error);
  }

}

export default App;


