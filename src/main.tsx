import React from 'react';
import ReactDOM from 'react-dom/client';
import Home from './App.tsx';
import AppAIWorld from './AppAIWorld.tsx';
import './index.css';
import 'uplot/dist/uPlot.min.css';
import 'react-toastify/dist/ReactToastify.css';
import ConvexClientProvider from './components/ConvexClientProvider.tsx';

// Check if we should show AI World Dashboard
const showAIWorld = window.location.pathname === '/aiworld' || window.location.search.includes('aiworld');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConvexClientProvider>
      {showAIWorld ? <AppAIWorld /> : <Home />}
    </ConvexClientProvider>
  </React.StrictMode>,
);
