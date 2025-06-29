"""
MCP (Model Context Protocol) Server Implementation
Provides structured access to travel-related resources and tools
"""

import asyncio
import json
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import os

logger = logging.getLogger(__name__)

@dataclass
class MCPResource:
    """Represents an MCP resource"""
    uri: str
    name: str
    description: str
    mimeType: str
    metadata: Dict[str, Any] = None

@dataclass
class MCPTool:
    """Represents an MCP tool"""
    name: str
    description: str
    inputSchema: Dict[str, Any]
    outputSchema: Dict[str, Any] = None

class MCPServer:
    """
    MCP Server implementation for travel agents
    Provides resources and tools for tourist and weather information
    """
    
    def __init__(self):
        self.resources: Dict[str, MCPResource] = {}
        self.tools: Dict[str, MCPTool] = {}
        self.ready = False
        
    async def initialize(self):
        """Initialize the MCP server with resources and tools"""
        try:
            logger.info("Initializing MCP Server...")
            
            # Register tourist-related resources
            await self._register_tourist_resources()
            
            # Register weather-related resources
            await self._register_weather_resources()
            
            # Register available tools
            await self._register_tools()
            
            self.ready = True
            logger.info("MCP Server initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize MCP Server: {str(e)}")
            raise
    
    def is_ready(self) -> bool:
        """Check if the MCP server is ready"""
        return self.ready
    
    async def get_resources(self) -> List[Dict[str, Any]]:
        """Get all available resources"""
        return [asdict(resource) for resource in self.resources.values()]
    
    async def get_resource(self, uri: str) -> Optional[Dict[str, Any]]:
        """Get a specific resource by URI"""
        resource = self.resources.get(uri)
        return asdict(resource) if resource else None
    
    async def get_tools(self) -> List[Dict[str, Any]]:
        """Get all available tools"""
        return [asdict(tool) for tool in self.tools.values()]
    
    async def call_tool(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Call a tool with the given arguments"""
        try:
            if name not in self.tools:
                raise ValueError(f"Tool '{name}' not found")
            
            # Route to appropriate tool handler
            if name == "find_tourist_spots":
                return await self._handle_find_tourist_spots(arguments)
            elif name == "get_weather_data":
                return await self._handle_get_weather_data(arguments)
            elif name == "geocode_location":
                return await self._handle_geocode_location(arguments)
            elif name == "calculate_distance":
                return await self._handle_calculate_distance(arguments)
            elif name == "get_travel_recommendations":
                return await self._handle_get_travel_recommendations(arguments)
            else:
                raise ValueError(f"Tool handler not implemented for '{name}'")
                
        except Exception as e:
            logger.error(f"Error calling tool {name}: {str(e)}")
            return {
                "error": str(e),
                "tool": name,
                "arguments": arguments
            }
    
    async def _register_tourist_resources(self):
        """Register tourist-related MCP resources"""
        
        # Google Places API resource
        self.resources["places://google/search"] = MCPResource(
            uri="places://google/search",
            name="Google Places Search",
            description="Search for tourist attractions and points of interest using Google Places API",
            mimeType="application/json",
            metadata={
                "api": "google_places",
                "version": "v1",
                "capabilities": ["nearby_search", "text_search", "place_details"],
                "rate_limits": {
                    "requests_per_second": 10,
                    "requests_per_day": 100000
                }
            }
        )
        
        # Tourist attractions database
        self.resources["db://tourist_attractions"] = MCPResource(
            uri="db://tourist_attractions",
            name="Tourist Attractions Database",
            description="Local database of curated tourist attractions with ratings and reviews",
            mimeType="application/json",
            metadata={
                "source": "local_database",
                "last_updated": datetime.now().isoformat(),
                "total_records": 50000,
                "coverage": "global"
            }
        )
        
        # Travel guides resource
        self.resources["guides://travel/destinations"] = MCPResource(
            uri="guides://travel/destinations",
            name="Travel Destination Guides",
            description="Comprehensive travel guides with insider tips and recommendations",
            mimeType="text/markdown",
            metadata={
                "content_type": "travel_guides",
                "languages": ["en", "es", "fr", "de"],
                "destinations": 500
            }
        )
    
    async def _register_weather_resources(self):
        """Register weather-related MCP resources"""
        
        # OpenWeatherMap API resource
        self.resources["weather://openweathermap"] = MCPResource(
            uri="weather://openweathermap",
            name="OpenWeatherMap API",
            description="Real-time weather data and forecasts from OpenWeatherMap",
            mimeType="application/json",
            metadata={
                "api": "openweathermap",
                "version": "2.5",
                "capabilities": ["current_weather", "forecast", "historical"],
                "update_frequency": "10_minutes"
            }
        )
        
        # Climate data resource
        self.resources["climate://historical_data"] = MCPResource(
            uri="climate://historical_data",
            name="Historical Climate Data",
            description="Historical weather patterns and climate data for travel planning",
            mimeType="application/json",
            metadata={
                "data_source": "meteorological_services",
                "time_range": "1990-2024",
                "geographic_coverage": "global",
                "parameters": ["temperature", "precipitation", "humidity", "wind"]
            }
        )
        
        # Weather alerts resource
        self.resources["alerts://weather_warnings"] = MCPResource(
            uri="alerts://weather_warnings",
            name="Weather Alerts and Warnings",
            description="Real-time weather alerts and travel advisories",
            mimeType="application/json",
            metadata={
                "sources": ["national_weather_services", "aviation_weather"],
                "alert_types": ["severe_weather", "travel_advisories", "natural_disasters"],
                "update_frequency": "real_time"
            }
        )
    
    async def _register_tools(self):
        """Register available MCP tools"""
        
        # Tourist spots finder tool
        self.tools["find_tourist_spots"] = MCPTool(
            name="find_tourist_spots",
            description="Find tourist attractions near a given location",
            inputSchema={
                "type": "object",
                "properties": {
                    "location": {"type": "string", "description": "Location name or address"},
                    "latitude": {"type": "number", "description": "Latitude coordinate"},
                    "longitude": {"type": "number", "description": "Longitude coordinate"},
                    "radius_km": {"type": "number", "default": 5, "description": "Search radius in kilometers"},
                    "max_results": {"type": "integer", "default": 20, "description": "Maximum number of results"},
                    "types": {"type": "array", "items": {"type": "string"}, "description": "Types of attractions to find"}
                },
                "required": ["location"]
            },
            outputSchema={
                "type": "object",
                "properties": {
                    "spots": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "id": {"type": "string"},
                                "name": {"type": "string"},
                                "description": {"type": "string"},
                                "latitude": {"type": "number"},
                                "longitude": {"type": "number"},
                                "rating": {"type": "number"},
                                "distance": {"type": "number"}
                            }
                        }
                    }
                }
            }
        )
        
        # Weather data tool
        self.tools["get_weather_data"] = MCPTool(
            name="get_weather_data",
            description="Get current weather and forecast for a location",
            inputSchema={
                "type": "object",
                "properties": {
                    "location": {"type": "string", "description": "Location name or address"},
                    "latitude": {"type": "number", "description": "Latitude coordinate"},
                    "longitude": {"type": "number", "description": "Longitude coordinate"},
                    "include_forecast": {"type": "boolean", "default": True, "description": "Include weather forecast"},
                    "forecast_days": {"type": "integer", "default": 5, "description": "Number of forecast days"}
                },
                "required": ["location"]
            },
            outputSchema={
                "type": "object",
                "properties": {
                    "current": {"type": "object"},
                    "forecast": {"type": "array"},
                    "alerts": {"type": "array"}
                }
            }
        )
        
        # Geocoding tool
        self.tools["geocode_location"] = MCPTool(
            name="geocode_location",
            description="Convert location name to coordinates",
            inputSchema={
                "type": "object",
                "properties": {
                    "location": {"type": "string", "description": "Location name or address"}
                },
                "required": ["location"]
            },
            outputSchema={
                "type": "object",
                "properties": {
                    "latitude": {"type": "number"},
                    "longitude": {"type": "number"},
                    "formatted_address": {"type": "string"},
                    "place_id": {"type": "string"}
                }
            }
        )
        
        # Distance calculation tool
        self.tools["calculate_distance"] = MCPTool(
            name="calculate_distance",
            description="Calculate distance between two coordinates",
            inputSchema={
                "type": "object",
                "properties": {
                    "lat1": {"type": "number"},
                    "lon1": {"type": "number"},
                    "lat2": {"type": "number"},
                    "lon2": {"type": "number"},
                    "unit": {"type": "string", "enum": ["km", "miles"], "default": "km"}
                },
                "required": ["lat1", "lon1", "lat2", "lon2"]
            },
            outputSchema={
                "type": "object",
                "properties": {
                    "distance": {"type": "number"},
                    "unit": {"type": "string"}
                }
            }
        )
        
        # Travel recommendations tool
        self.tools["get_travel_recommendations"] = MCPTool(
            name="get_travel_recommendations",
            description="Get personalized travel recommendations based on weather and attractions",
            inputSchema={
                "type": "object",
                "properties": {
                    "location": {"type": "string"},
                    "weather_data": {"type": "object"},
                    "tourist_spots": {"type": "array"},
                    "travel_preferences": {"type": "object"},
                    "trip_duration": {"type": "integer", "description": "Trip duration in days"}
                },
                "required": ["location"]
            },
            outputSchema={
                "type": "object",
                "properties": {
                    "recommendations": {"type": "array"},
                    "best_times": {"type": "array"},
                    "travel_tips": {"type": "array"},
                    "itinerary": {"type": "object"}
                }
            }
        )
    
    async def _handle_find_tourist_spots(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Handle find_tourist_spots tool call"""
        try:
            # Import here to avoid circular imports
            from ..agents.tourist_agent import TouristAgent
            
            tourist_agent = TouristAgent()
            await tourist_agent.initialize()
            
            spots = await tourist_agent.find_tourist_spots(
                location=arguments["location"],
                latitude=arguments.get("latitude"),
                longitude=arguments.get("longitude"),
                radius_km=arguments.get("radius_km", 5),
                max_results=arguments.get("max_results", 20)
            )
            
            return {
                "success": True,
                "spots": spots,
                "tool": "find_tourist_spots",
                "location": arguments["location"]
            }
            
        except Exception as e:
            logger.error(f"Error in find_tourist_spots tool: {str(e)}")
            return {"error": str(e), "tool": "find_tourist_spots"}
    
    async def _handle_get_weather_data(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Handle get_weather_data tool call"""
        try:
            # Import here to avoid circular imports
            from ..agents.weather_agent import WeatherAgent
            
            weather_agent = WeatherAgent()
            await weather_agent.initialize()
            
            weather_data = await weather_agent.get_weather_info(
                location=arguments["location"],
                latitude=arguments.get("latitude"),
                longitude=arguments.get("longitude")
            )
            
            return {
                "success": True,
                "weather": weather_data,
                "tool": "get_weather_data",
                "location": arguments["location"]
            }
            
        except Exception as e:
            logger.error(f"Error in get_weather_data tool: {str(e)}")
            return {"error": str(e), "tool": "get_weather_data"}
    
    async def _handle_geocode_location(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Handle geocode_location tool call"""
        try:
            # Simple geocoding implementation
            # In a real implementation, this would use a geocoding service
            location = arguments["location"]
            
            # Mock geocoding response
            return {
                "success": True,
                "latitude": 0.0,
                "longitude": 0.0,
                "formatted_address": location,
                "place_id": f"mock_place_id_{hash(location)}",
                "tool": "geocode_location",
                "note": "Mock geocoding - integrate with real service"
            }
            
        except Exception as e:
            logger.error(f"Error in geocode_location tool: {str(e)}")
            return {"error": str(e), "tool": "geocode_location"}
    
    async def _handle_calculate_distance(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Handle calculate_distance tool call"""
        try:
            import math
            
            lat1, lon1 = arguments["lat1"], arguments["lon1"]
            lat2, lon2 = arguments["lat2"], arguments["lon2"]
            unit = arguments.get("unit", "km")
            
            # Haversine formula
            lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
            c = 2 * math.asin(math.sqrt(a))
            r = 6371  # Earth's radius in kilometers
            
            distance = c * r
            
            if unit == "miles":
                distance = distance * 0.621371
            
            return {
                "success": True,
                "distance": round(distance, 2),
                "unit": unit,
                "tool": "calculate_distance"
            }
            
        except Exception as e:
            logger.error(f"Error in calculate_distance tool: {str(e)}")
            return {"error": str(e), "tool": "calculate_distance"}
    
    async def _handle_get_travel_recommendations(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Handle get_travel_recommendations tool call"""
        try:
            location = arguments["location"]
            weather_data = arguments.get("weather_data", {})
            tourist_spots = arguments.get("tourist_spots", [])
            
            recommendations = []
            travel_tips = []
            best_times = []
            
            # Generate recommendations based on available data
            if tourist_spots:
                top_spots = sorted(tourist_spots, key=lambda x: x.get('rating', 0), reverse=True)[:3]
                for spot in top_spots:
                    recommendations.append(f"Visit {spot['name']} - highly rated attraction")
            
            if weather_data:
                temp = weather_data.get('temperature', 20)
                if temp > 25:
                    recommendations.append("Great weather for outdoor activities")
                    travel_tips.append("Stay hydrated and use sunscreen")
                elif temp < 10:
                    recommendations.append("Pack warm clothes for cold weather")
                    travel_tips.append("Consider indoor attractions")
                
                best_times.append("Check hourly forecast for optimal timing")
            
            # General travel tips
            travel_tips.extend([
                "Research local customs and etiquette",
                "Keep copies of important documents",
                "Inform your bank about travel plans"
            ])
            
            return {
                "success": True,
                "recommendations": recommendations,
                "best_times": best_times,
                "travel_tips": travel_tips,
                "itinerary": {
                    "location": location,
                    "generated_at": datetime.now().isoformat(),
                    "activities": recommendations[:5]
                },
                "tool": "get_travel_recommendations"
            }
            
        except Exception as e:
            logger.error(f"Error in get_travel_recommendations tool: {str(e)}")
            return {"error": str(e), "tool": "get_travel_recommendations"}
