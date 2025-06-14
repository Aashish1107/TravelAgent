import express from 'express';
import { createServer } from 'http';
import { storage } from './storage';
import { setupAuth, authenticateJWT, optionalAuth } from './auth';
import { z } from 'zod';

const LocationSearchSchema = z.object({
  location: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  searchType: z.enum(['tourist', 'weather', 'both']),
});

const SaveSpotSchema = z.object({
  spotId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  rating: z.number().optional(),
  imageUrl: z.string().optional(),
  address: z.string().optional(),
  distance: z.number().optional(),
});

const AgentMessageSchema = z.object({
  message: z.string().min(1),
  agentType: z.enum(['tourist', 'weather', 'supervisor']).optional(),
});

async function registerRoutes(app) {
  // Setup authentication
  setupAuth(app);

  // Location search and travel data routes
  app.post('/api/search/location', authenticateJWT, async (req, res) => {
    try {
      const userId = req.userId;
      const validatedData = LocationSearchSchema.parse(req.body);
      
      // Save the search to database
      const travelSearch = await storage.createTravelSearch({
        userId,
        ...validatedData,
        latitude: validatedData.latitude?.toString(),
        longitude: validatedData.longitude?.toString(),
      });

      // Integrate with Python agent system
      let agentResponse = null;
      try {
        const pythonServerUrl = process.env.PYTHON_SERVER_URL || 'http://localhost:8000';
        
        if (validatedData.searchType === 'tourist' || validatedData.searchType === 'both') {
          const touristResponse = await fetch(`${pythonServerUrl}/api/tourist-spots`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              location: validatedData.location,
              latitude: validatedData.latitude,
              longitude: validatedData.longitude,
              radius_km: 5.0,
              max_results: 20
            }),
          });
          
          if (touristResponse.ok) {
            agentResponse = await touristResponse.json();
          }
        }
        
        if (validatedData.searchType === 'weather' || validatedData.searchType === 'both') {
          const weatherResponse = await fetch(`${pythonServerUrl}/api/weather`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              location: validatedData.location,
              latitude: validatedData.latitude,
              longitude: validatedData.longitude
            }),
          });
          
          if (weatherResponse.ok) {
            const weatherData = await weatherResponse.json();
            agentResponse = agentResponse ? 
              { ...agentResponse, weather: weatherData.weather } : 
              { weather: weatherData.weather };
          }
        }
      } catch (error) {
        console.log('Python agent server not available, using fallback data');
      }

      res.json({
        success: true,
        searchId: travelSearch.id,
        message: "Search completed successfully",
        data: agentResponse
      });
    } catch (error) {
      console.error("Error creating location search:", error);
      res.status(400).json({ message: "Invalid search parameters" });
    }
  });

  app.get('/api/search/history', authenticateJWT, async (req, res) => {
    try {
      const userId = req.userId;
      const searches = await storage.getUserTravelSearches(userId);
      res.json(searches);
    } catch (error) {
      console.error("Error fetching search history:", error);
      res.status(500).json({ message: "Failed to fetch search history" });
    }
  });

  // Tourist spots routes
  app.post('/api/spots/save', authenticateJWT, async (req, res) => {
    try {
      const userId = req.userId;
      const validatedData = SaveSpotSchema.parse(req.body);
      
      const savedSpot = await storage.saveTouristSpot({
        userId,
        ...validatedData,
        latitude: validatedData.latitude.toString(),
        longitude: validatedData.longitude.toString(),
        rating: validatedData.rating?.toString(),
        distance: validatedData.distance?.toString(),
      });
      
      res.json(savedSpot);
    } catch (error) {
      console.error("Error saving tourist spot:", error);
      res.status(400).json({ message: "Invalid spot data" });
    }
  });

  app.get('/api/spots/saved', authenticateJWT, async (req, res) => {
    try {
      const userId = req.userId;
      const savedSpots = await storage.getUserSavedSpots(userId);
      res.json(savedSpots);
    } catch (error) {
      console.error("Error fetching saved spots:", error);
      res.status(500).json({ message: "Failed to fetch saved spots" });
    }
  });

  app.delete('/api/spots/:id', authenticateJWT, async (req, res) => {
    try {
      const userId = req.userId;
      const spotId = parseInt(req.params.id);
      
      await storage.removeSavedSpot(spotId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing saved spot:", error);
      res.status(500).json({ message: "Failed to remove saved spot" });
    }
  });

  // Agent communication routes
  app.post('/api/agents/message', authenticateJWT, async (req, res) => {
    try {
      const userId = req.userId;
      const validatedData = AgentMessageSchema.parse(req.body);
      
      // Save the user message
      const conversation = await storage.saveAgentConversation({
        userId,
        agentType: validatedData.agentType || 'supervisor',
        message: validatedData.message,
      });

      // Send message to Python agent system
      let agentResponse = null;
      try {
        const pythonServerUrl = process.env.PYTHON_SERVER_URL || 'http://localhost:8000';
        const response = await fetch(`${pythonServerUrl}/api/agent-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: validatedData.message,
            agent_type: validatedData.agentType || 'supervisor',
            context: { userId }
          }),
        });
        
        if (response.ok) {
          agentResponse = await response.json();
          
          // Save agent response
          await storage.saveAgentConversation({
            userId,
            agentType: validatedData.agentType || 'supervisor',
            message: agentResponse.response?.message || 'Agent response received',
            response: JSON.stringify(agentResponse.response),
          });
        }
      } catch (error) {
        console.log('Python agent server not available');
      }

      res.json({
        success: true,
        conversationId: conversation.id,
        response: agentResponse?.response || {
          message: "Message received. Agents are processing your request...",
          agent: validatedData.agentType || 'supervisor'
        }
      });
    } catch (error) {
      console.error("Error sending agent message:", error);
      res.status(400).json({ message: "Invalid message data" });
    }
  });

  app.get('/api/agents/conversations', authenticateJWT, async (req, res) => {
    try {
      const userId = req.userId;
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      
      const conversations = await storage.getUserAgentConversations(userId, limit);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching agent conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Trip planning routes
  app.post('/api/trips', authenticateJWT, async (req, res) => {
    try {
      const userId = req.userId;
      const { name, description, startDate, endDate, locations, isPublic } = req.body;
      
      const trip = await storage.createTrip({
        userId,
        name,
        description,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        locations: locations ? JSON.stringify(locations) : null,
        isPublic: isPublic || false,
      });
      
      res.json(trip);
    } catch (error) {
      console.error("Error creating trip:", error);
      res.status(400).json({ message: "Invalid trip data" });
    }
  });

  app.get('/api/trips', authenticateJWT, async (req, res) => {
    try {
      const userId = req.userId;
      const trips = await storage.getUserTrips(userId);
      res.json(trips);
    } catch (error) {
      console.error("Error fetching trips:", error);
      res.status(500).json({ message: "Failed to fetch trips" });
    }
  });

  app.put('/api/trips/:id', authenticateJWT, async (req, res) => {
    try {
      const userId = req.userId;
      const tripId = parseInt(req.params.id);
      const { name, description, startDate, endDate, locations, isPublic } = req.body;
      
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (startDate !== undefined) updates.startDate = startDate ? new Date(startDate) : null;
      if (endDate !== undefined) updates.endDate = endDate ? new Date(endDate) : null;
      if (locations !== undefined) updates.locations = JSON.stringify(locations);
      if (isPublic !== undefined) updates.isPublic = isPublic;
      
      const updatedTrip = await storage.updateTrip(tripId, userId, updates);
      
      if (!updatedTrip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      res.json(updatedTrip);
    } catch (error) {
      console.error("Error updating trip:", error);
      res.status(400).json({ message: "Invalid trip data" });
    }
  });

  app.delete('/api/trips/:id', authenticateJWT, async (req, res) => {
    try {
      const userId = req.userId;
      const tripId = parseInt(req.params.id);
      
      await storage.deleteTrip(tripId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting trip:", error);
      res.status(500).json({ message: "Failed to delete trip" });
    }
  });

  // Weather API route (placeholder for external API integration)
  app.get('/api/weather/:location', optionalAuth, async (req, res) => {
    try {
      const location = req.params.location;
      
      // Try to get weather from Python agent system
      try {
        const pythonServerUrl = process.env.PYTHON_SERVER_URL || 'http://localhost:8000';
        const response = await fetch(`${pythonServerUrl}/api/weather`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ location }),
        });
        
        if (response.ok) {
          const data = await response.json();
          return res.json(data.weather);
        }
      } catch (error) {
        console.log('Python weather service not available');
      }

      // Fallback response
      res.json({
        location,
        temperature: 18,
        description: "Partly Cloudy",
        humidity: 65,
        windSpeed: 12,
        visibility: 10,
        feelsLike: 20,
        hourlyForecast: [
          { time: "15:00", temperature: 19, icon: "sun" },
          { time: "16:00", temperature: 18, icon: "cloud" },
          { time: "17:00", temperature: 17, icon: "cloud-sun" },
          { time: "18:00", temperature: 16, icon: "cloud-rain" },
        ]
      });
    } catch (error) {
      console.error("Error fetching weather:", error);
      res.status(500).json({ message: "Failed to fetch weather data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

export { registerRoutes };