"""
Supervisor Agent - Coordinates between Tourist and Weather agents
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
import json

from .location_agent import LocationAgent
from .weather_agent import WeatherAgent

logger = logging.getLogger(__name__)

@dataclass
class TravelPlan:
    location: str
    tourist_spots: List[Dict[str, Any]]
    weather_info: Dict[str, Any]
    recommendations: List[str]
    best_times_to_visit: List[str]
    travel_tips: List[str]

class SupervisorAgent:
    """
    Supervisor agent that coordinates between specialized agents
    """
    
    def __init__(self):
        self.tourist_agent = None
        self.weather_agent = None
        self.ready = False
        
    async def initialize(self):
        """Initialize the supervisor and its sub-agents"""
        try:
            logger.info("Initializing Supervisor Agent...")
            
            # Initialize sub-agents
            self.tourist_agent = TouristAgent()
            self.weather_agent = WeatherAgent()
            
            await self.tourist_agent.initialize()
            await self.weather_agent.initialize()
            
            self.ready = True
            logger.info("Supervisor Agent initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Supervisor Agent: {str(e)}")
            raise
    
    def is_ready(self) -> bool:
        """Check if the supervisor agent is ready"""
        return self.ready and self.tourist_agent.is_ready() and self.weather_agent.is_ready()
    
    async def process_message(self, message: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Process a message and coordinate with appropriate agents
        """
        try:
            logger.info(f"Supervisor processing message: {message}")
            
            if not self.is_ready():
                return {
                    "error": "Supervisor agent not ready",
                    "message": "Please wait while the system initializes"
                }
            
            # Analyze message to determine which agents to involve
            message_lower = message.lower()
            
            # Check if message is about tourist spots
            if any(keyword in message_lower for keyword in ['tourist', 'attraction', 'visit', 'see', 'place', 'spot']):
                tourist_response = await self.tourist_agent.process_message(message, context)
                
                # Also get weather if location is mentioned
                if any(keyword in message_lower for keyword in ['weather', 'temperature', 'rain', 'sunny']):
                    weather_response = await self.weather_agent.process_message(message, context)
                    return {
                        "agent": "supervisor",
                        "message": "I've coordinated with both our Tourist and Weather agents for you.",
                        "tourist_info": tourist_response,
                        "weather_info": weather_response,
                        "recommendation": "Based on both tourist attractions and weather data, here's what I recommend for your trip."
                    }
                
                return {
                    "agent": "supervisor",
                    "message": "I've consulted with our Tourist agent for you.",
                    "tourist_info": tourist_response,
                    "recommendation": "These are the best tourist spots I found for your location."
                }
            
            # Check if message is about weather
            elif any(keyword in message_lower for keyword in ['weather', 'temperature', 'rain', 'sunny', 'climate', 'forecast']):
                weather_response = await self.weather_agent.process_message(message, context)
                return {
                    "agent": "supervisor",
                    "message": "I've consulted with our Weather agent for you.",
                    "weather_info": weather_response,
                    "recommendation": "Here's the weather information for your location."
                }
            
            # General travel planning
            else:
                return {
                    "agent": "supervisor",
                    "message": "I'm here to help you plan your travel! I can coordinate with our specialist agents to provide information about tourist attractions and weather conditions. What would you like to know about your destination?",
                    "capabilities": [
                        "Find tourist attractions and points of interest",
                        "Get weather forecasts and climate information",
                        "Create comprehensive travel plans",
                        "Provide personalized recommendations"
                    ]
                }
                
        except Exception as e:
            logger.error(f"Error processing message in supervisor: {str(e)}")
            return {
                "error": "Failed to process message",
                "message": "I'm having trouble processing your request. Please try again."
            }
    
    async def create_travel_plan(self, location: str, latitude: float = None, longitude: float = None) -> TravelPlan:
        """
        Create a comprehensive travel plan by coordinating all agents
        """
        try:
            logger.info(f"Creating travel plan for: {location}")
            
            if not self.is_ready():
                raise Exception("Supervisor agent not ready")
            
            # Get tourist spots
            tourist_spots = await self.tourist_agent.find_tourist_spots(
                location=location,
                latitude=latitude,
                longitude=longitude
            )
            
            # Get weather information
            weather_info = await self.weather_agent.get_weather_info(
                location=location,
                latitude=latitude,
                longitude=longitude
            )
            
            # Generate recommendations based on combined data
            recommendations = self._generate_recommendations(tourist_spots, weather_info)
            
            # Generate timing recommendations
            best_times = self._generate_timing_recommendations(weather_info)
            
            # Generate travel tips
            travel_tips = self._generate_travel_tips(tourist_spots, weather_info)
            
            travel_plan = TravelPlan(
                location=location,
                tourist_spots=tourist_spots,
                weather_info=weather_info,
                recommendations=recommendations,
                best_times_to_visit=best_times,
                travel_tips=travel_tips
            )
            
            logger.info(f"Travel plan created successfully for {location}")
            return travel_plan.__dict__
            
        except Exception as e:
            logger.error(f"Error creating travel plan: {str(e)}")
            raise
    
    def _generate_recommendations(self, tourist_spots: List[Dict], weather_info: Dict) -> List[str]:
        """Generate recommendations based on spots and weather"""
        recommendations = []
        
        if tourist_spots:
            # Recommend top-rated spots
            top_spots = sorted(tourist_spots, key=lambda x: x.get('rating', 0), reverse=True)[:3]
            for spot in top_spots:
                recommendations.append(f"Visit {spot['name']} - {spot.get('description', 'Highly rated attraction')}")
        
        # Weather-based recommendations
        if weather_info:
            temp = weather_info.get('temperature', 20)
            description = weather_info.get('description', '').lower()
            
            if temp > 25:
                recommendations.append("Great weather for outdoor activities and sightseeing!")
            elif temp < 10:
                recommendations.append("Pack warm clothes and consider indoor attractions.")
            
            if 'rain' in description:
                recommendations.append("Bring an umbrella and have backup indoor plans.")
            elif 'sunny' in description:
                recommendations.append("Perfect weather for exploring outdoor attractions!")
        
        return recommendations
    
    def _generate_timing_recommendations(self, weather_info: Dict) -> List[str]:
        """Generate timing recommendations based on weather"""
        timing_recommendations = []
        
        if weather_info and 'hourlyForecast' in weather_info:
            # Analyze hourly forecast for best times
            hourly = weather_info['hourlyForecast']
            
            # Find best hours (least chance of rain, good temperature)
            best_hours = []
            for hour in hourly:
                if 'rain' not in hour.get('icon', ''):
                    best_hours.append(hour['time'])
            
            if best_hours:
                timing_recommendations.append(f"Best times to visit: {', '.join(best_hours[:3])}")
        
        # General timing advice
        timing_recommendations.extend([
            "Early morning (8-10 AM) for fewer crowds",
            "Late afternoon (4-6 PM) for golden hour photos",
            "Check local peak hours and plan accordingly"
        ])
        
        return timing_recommendations
    
    def _generate_travel_tips(self, tourist_spots: List[Dict], weather_info: Dict) -> List[str]:
        """Generate travel tips based on available data"""
        tips = []
        
        # General tips
        tips.append("Research local customs and etiquette")
        tips.append("Keep copies of important documents")
        tips.append("Inform your bank about travel plans")
        
        # Weather-based tips
        if weather_info:
            temp = weather_info.get('temperature', 20)
            humidity = weather_info.get('humidity', 50)
            
            if temp > 30:
                tips.append("Stay hydrated and wear sunscreen")
            elif temp < 5:
                tips.append("Dress in layers and protect against frostbite")
            
            if humidity > 70:
                tips.append("Expect high humidity, dress in breathable fabrics")
        
        # Attraction-specific tips
        if tourist_spots:
            if len(tourist_spots) > 5:
                tips.append("Consider getting a city pass for multiple attractions")
            
            # Check if any spots require advance booking
            popular_spots = [s for s in tourist_spots if s.get('rating', 0) > 4.5]
            if popular_spots:
                tips.append("Book tickets in advance for popular attractions")
        
        return tips
