const dotenv = require('dotenv').config();
const express = require('express');
const { registerRoutes } = require('./routes');
const { setupVite, serveStatic } = require('./vite');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function startServer() {
  try {
    // Register routes and setup authentication
    const httpServer = await registerRoutes(app);
    
    if (process.env.NODE_ENV === 'development') {
      await setupVite(app, httpServer);
    } else {
      serveStatic(app);
    }

    httpServer.listen(PORT, '0.0.0.0', () => {
      const formattedTime = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(new Date());

      console.log(`${formattedTime} [express] serving on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Error handling middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
}));
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  next();
});

startServer();