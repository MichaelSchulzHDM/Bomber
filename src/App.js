import './App.css';
import React, { useMemo, useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from './theme';
import Header from './Header';
import Tabelle from './TabelleAG-Grid';

function App() {

  const [mode, setMode] = useState('light');

  const theme = useMemo(() => getTheme(mode), [mode]);
  return (
    <div className="App-container">
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Header mode={mode} setMode={setMode} />
        <Tabelle mode={mode} setMode={setMode} />

      </ThemeProvider>
    </div>
  );
}
export default App;


