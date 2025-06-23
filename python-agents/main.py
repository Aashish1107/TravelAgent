"""
TravelAgent Pro - Python Agent Server
Multi-agent system for travel planning using LangGraph and MCP protocol
"""

import asyncio
import logging
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv

from agents.supervisor import SupervisorAgent
from agents.tourist_agent import TouristAgent
from agents.weather_agent import WeatherAgent
from mcp.server import MCPServer

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="TravelAgent Pro - AI Agent Server",
    description="Multi-agent system for intelligent travel planning",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API requests
class LocationRequest(BaseModel):
    location: str
    latitude: float = None
    longitude: float = None

class TouristSpotsRequest(BaseModel):
    location: str
    latitude: float = None
    longitude: float = None
    radius_km: float = 5.0
    max_results: int = 20

class WeatherRequest(BaseModel):
    location: str
    latitude: float = None
    longitude: float = None

class AgentMessageRequest(BaseModel):
    message: str
    agent_type: str = "supervisor"
    context: Dict[str, Any] = {}

# Initialize agents
supervisor_agent = SupervisorAgent()
tourist_agent = TouristAgent()
weather_agent = WeatherAgent()
mcp_server = MCPServer()

# Agent registry
agents = {
    "supervisor": supervisor_agent,
    "tourist": tourist_agent,
    "weather": weather_agent
}

@app.on_event("startup")
async def startup_event():
    """Initialize agents and MCP server on startup"""
    logger.info("Starting TravelAgent Pro Agent Server...")
    
    # Initialize MCP server
    await mcp_server.initialize()
    
    # Initialize agents
    await supervisor_agent.initialize()
    await tourist_agent.initialize()
    await weather_agent.initialize()
    
    logger.info("All agents initialized successfully")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "TravelAgent Pro Agent Server",
        "status": "running",
        "agents": list(agents.keys())
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "agents": {
            "supervisor": supervisor_agent.is_ready(),
            "tourist": tourist_agent.is_ready(),
            "weather": weather_agent.is_ready()
        },
        "mcp_server": mcp_server.is_ready()
    }

@app.post("/api/tourist-spots")
async def get_tourist_spots(request: TouristSpotsRequest):
    """Get tourist spots for a location"""
    try:
        logger.info(f"Getting tourist spots for: {request.location}")
        
        # Use tourist agent to find spots
        spots = await tourist_agent.find_tourist_spots(
            location=request.location,
            latitude=request.latitude,
            longitude=request.longitude,
            radius_km=request.radius_km,
            max_results=request.max_results
        )
        
        return {
            "success": True,
            "location": request.location,
            "spots": spots,
            "count": len(spots)
        }
        
    except Exception as e:
        logger.error(f"Error getting tourist spots: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/weather")
async def get_weather(request: WeatherRequest):
    """Get weather information for a location"""
    try:
        logger.info(f"Getting weather for: {request.location}")
        
        # Use weather agent to get weather data
        weather_data = await weather_agent.get_weather_info(
            location=request.location,
            latitude=request.latitude,
            longitude=request.longitude
        )
        
        return {
            "success": True,
            "location": request.location,
            "weather": weather_data
        }
        
    except Exception as e:
        logger.error(f"Error getting weather: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agent-message")
async def send_agent_message(request: AgentMessageRequest):
    """Send a message to an agent"""
    try:
        logger.info(f"Sending message to {request.agent_type} agent: {request.message}")
        
        if request.agent_type not in agents:
            raise HTTPException(status_code=400, detail=f"Unknown agent type: {request.agent_type}")
        
        agent = agents[request.agent_type]
        
        # Process message through agent
        response = await agent.process_message(request.message, request.context)
        
        return {
            "success": True,
            "agent": request.agent_type,
            "response": response
        }
        
    except Exception as e:
        logger.error(f"Error processing agent message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/travel-plan")
async def create_travel_plan(request: LocationRequest):
    """Create a comprehensive travel plan using all agents"""
    try:
        logger.info(f"Creating travel plan for: {request.location}")
        
        # Use supervisor to coordinate agents
        travel_plan = await supervisor_agent.create_travel_plan(
            location=request.location,
            latitude=request.latitude,
            longitude=request.longitude
        )
        
        return {
            "success": True,
            "location": request.location,
            "plan": travel_plan
        }
        
    except Exception as e:
        logger.error(f"Error creating travel plan: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/mcp/resources")
async def get_mcp_resources():
    """Get available MCP resources"""
    try:
        resources = await mcp_server.get_resources()
        return {
            "success": True,
            "resources": resources
        }
    except Exception as e:
        logger.error(f"Error getting MCP resources: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PYTHON_SERVER_PORT", 8000))
    host = os.getenv("PYTHON_SERVER_HOST", "0.0.0.0")
    
    logger.info(f"Starting server on {host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
