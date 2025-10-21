const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Servir página principal
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Servir favicon
app.get('/favicon.svg', (req, res) => {
  res.sendFile(__dirname + '/favicon.svg');
});

// Exportar app para Vercel
module.exports = app;
