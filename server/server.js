import express from 'express';
import { registerRoutes } from './routes';
import { setupVite, serveStatic } from './vite';

const app = express();
const PORT = process.env.PORT || 5000; // Ensure "type": "module" is set in package.json

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
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

startServer();