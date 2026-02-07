import React from 'react';
import ReactDOM from 'react-dom/client';
import Home from './App.tsx';
import AppAIWorld from './AppAIWorld.tsx';
import AIWorldGame from './components/AIWorldGame.tsx';
import './index.css';
import 'uplot/dist/uPlot.min.css';
import 'react-toastify/dist/ReactToastify.css';
import ConvexClientProvider from './components/ConvexClientProvider.tsx';

// Check if we should show AI World Dashboard or Game
const showAIWorld = window.location.pathname === '/aiworld' || window.location.search.includes('aiworld');
const showAIWorldGame = window.location.pathname === '/game' || window.location.search.includes('game');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConvexClientProvider>
      {showAIWorldGame ? <AIWorldGame /> : (showAIWorld ? <AppAIWorld /> : <Home />)}
    </ConvexClientProvider>
  </React.StrictMode>,
);
