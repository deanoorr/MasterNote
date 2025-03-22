import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

// Debug: Check if API key is properly loaded
console.log('API Key available:', !!import.meta.env.VITE_OPENAI_API_KEY);
console.log('API Key prefix:', import.meta.env.VITE_OPENAI_API_KEY?.substring(0, 10) + '...');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 