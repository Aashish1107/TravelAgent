"""
Weather Agent - Specializes in weather information and forecasts
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional
import os
import json
import requests
from dataclasses import dataclass
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

@dataclass
class WeatherData:
    location: str
    temperature: float
    description: str
    humidity: int
    wind_speed: float
    visibility: float
    feels_like: float
    pressure: float
    uv_index: float
    hourly_forecast: List[Dict[str, Any]]
    daily_forecast: List[Dict[str, Any]]

class WeatherAgent:
    """
    Agent specialized in weather information using OpenWeatherMap API
    """
    
    def __init__(self):
        self.openweather_api_key = os.getenv('WEATHER_API_KEY')
        self.weather_base_url = "https://weather.googleapis.com/v1"
        self.geocoding_url = "https://maps.googleapis.com/maps/api/geocode/json"
        self.ready = False
        
    async def initialize(self):
        """Initialize the weather agent"""
        try:
            logger.info("Initializing Weather Agent...")
            
            if not self.openweather_api_key:
                logger.warning("OpenWeatherMap API key not found. Using fallback data.")
                
            self.ready = True
            logger.info("Weather Agent initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Weather Agent: {str(e)}")
            raise
    
    def is_ready(self) -> bool:
        """Check if the weather agent is ready"""
        return self.ready
    
    async def process_message(self, message: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process a message about weather"""
        try:
            logger.info(f"Weather agent processing message: {message}")
            
            # Extract location from message or context
            location = self._extract_location_from_message(message, context)
            
            if location:
                weather_data = await self.get_weather_info(location=location)
                return {
                    "agent": "weather",
                    "message": f"Here's the current weather information for {location}",
                    "weather": weather_data,
                    "recommendations": self._generate_weather_recommendations(weather_data)
                }
            else:
                return {
                    "agent": "weather",
                    "message": "I can provide weather information for any location! Please tell me where you'd like to check the weather.",
                    "suggestions": [
                        "Ask me about current weather in any city",
                        "I can provide forecasts and weather conditions",
                        "Just mention a location and I'll get the latest weather data"
                    ]
                }
                
        except Exception as e:
            logger.error(f"Error processing message in weather agent: {str(e)}")
            return {
                "error": "Failed to process weather request",
                "message": "I'm having trouble getting weather information. Please try again."
            }
    
    async def get_weather_info(self, location: str, latitude: float = None, longitude: float = None) -> Dict[str, Any]:
        """
        Get comprehensive weather information for a location
        """
        try:
            logger.info(f"Getting weather info for: {location}")
            
            # If we have coordinates, use them directly
            if latitude and longitude:
                return await self._get_weather_by_coordinates(latitude, longitude, location)
            
            # Otherwise, geocode the location first
            coords = await self._geocode_location(location)
            if coords:
                return await self._get_weather_by_coordinates(coords['lat'], coords['lon'], location)
            
            # Fallback to default weather data if API is not available
            return self._get_fallback_weather_data(location)
            
        except Exception as e:
            logger.error(f"Error getting weather info: {str(e)}")
            return self._get_fallback_weather_data(location)
    
    async def _geocode_location(self, location: str) -> Optional[Dict[str, float]]:
        """Convert location name to coordinates using OpenWeatherMap geocoding"""
        try:
            if not self.openweather_api_key:
                return None
            
            url = f"{self.geocoding_url}"
            params = {
                'address': location,
                'key': self.openweather_api_key,
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            if data:
                return {
                    'lat': data['results'][0]['geometry']['location']['lat'],
                    'lon': data['results'][0]['geometry']['location']['lng'],
                    'name': data['results'][0]['formatted_address'] if data['results'][0]['formatted_address'] else 'Unknown',
                    'country': data['results'][0]['address_components'][-1]['long_name'] if data['results'][0]['address_components'] else 'Unknown'
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error geocoding location: {str(e)}")
            return None
    
    async def _get_weather_by_coordinates(self, latitude: float, longitude: float, location: str) -> Dict[str, Any]:
        """Get weather data using coordinates"""
        try:
            if not self.openweather_api_key:
                return self._get_fallback_weather_data(location)
            
            # Get current weather
            current_url = f"{self.weather_base_url}/currentConditions:lookup"
            current_params = {
                'location.latitude': latitude,
                'location.longitude': longitude,
                'key': self.openweather_api_key,
            }
            
            current_response = requests.get(current_url, params=current_params, timeout=10)
            current_response.raise_for_status()
            current_data = current_response.json()
            
            # Get forecast data
            forecast_url = f"{self.weather_base_url}/forecast/days:lookup"
            forecast_params = {
                'location.latitude': latitude,
                'location.longitude': longitude,
                'key': self.openweather_api_key,
            }
            
            forecast_response = requests.get(forecast_url, params=forecast_params, timeout=10)
            forecast_response.raise_for_status()
            forecast_data = forecast_response.json()
            
            # Format the weather data
            return self._format_weather_data(current_data, forecast_data, location)
            
        except Exception as e:
            logger.error(f"Error getting weather by coordinates: {str(e)}")
            return self._get_fallback_weather_data(location)
    
    def _format_weather_data(self, current_data: Dict, forecast_data: Dict, location: str) -> Dict[str, Any]:
        """Format OpenWeatherMap API response into our format"""
        try:
            # Current weather
            logger.info(f"Current Data: {current_data}")
            logger.info(f"Forecast data: {forecast_data}")
            weatherIcon = current_data['weatherCondition']['iconBaseUri']
            
            # Generate hourly forecast from 5-day forecast (3-hour intervals)
            hourly_forecast = []
            for item in forecast_data['list'][:8]:  # Next 24 hours (8 * 3-hour intervals)
                forecast_time = datetime.fromtimestamp(item['dt'])
                hourly_forecast.append({
                    'time': forecast_time.strftime('%H:%M'),
                    'temperature': round(item['main']['temp']),
                    'description': item['weather'][0]['description'],
                    'icon': self._map_weather_icon(item['weather'][0]['icon']),
                    'humidity': item['main']['humidity'],
                    'wind_speed': item.get('wind', {}).get('speed', 0)
                })
            
            # Generate daily forecast
            daily_forecast = []
            daily_temps = {}
            
            for item in forecast_data['list']:
                date = datetime.fromtimestamp(item['dt']).date()
                if date not in daily_temps:
                    daily_temps[date] = {
                        'temps': [],
                        'descriptions': [],
                        'icons': []
                    }
                
                daily_temps[date]['temps'].append(item['main']['temp'])
                daily_temps[date]['descriptions'].append(item['weather'][0]['description'])
                daily_temps[date]['icons'].append(item['weather'][0]['icon'])
            
            for date, data in list(daily_temps.items())[:5]:  # Next 5 days
                avg_temp = sum(data['temps']) / len(data['temps'])
                max_temp = max(data['temps'])
                min_temp = min(data['temps'])
                
                # Most common description
                most_common_desc = max(set(data['descriptions']), key=data['descriptions'].count)
                most_common_icon = max(set(data['icons']), key=data['icons'].count)
                
                daily_forecast.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'day_name': date.strftime('%A'),
                    'max_temp': round(max_temp),
                    'min_temp': round(min_temp),
                    'avg_temp': round(avg_temp),
                    'description': most_common_desc,
                    'icon': self._map_weather_icon(most_common_icon)
                })
            
            return {
                'location': location,
                'temperature': current_data['temperature']['degrees'],
                'description': current_data['description']['text'],
                'humidity': current_data['relativeHumidity'],
                'windSpeed': current_data['wind']['speed']['value'],
                'visibility': current_data['visibility']['distance'],
                'feelsLike': current_data['feelsLikeTemperature']['degrees'],
                'pressure': current_data['airPressure']['meanSeaLevelMillibars'],
                'uvIndex': current_data['uvIndex'],
                'sunrise': datetime.fromtimestamp(current_data['sys']['sunrise']).strftime('%H:%M'),
                'sunset': datetime.fromtimestamp(current_data['sys']['sunset']).strftime('%H:%M'),
                'hourlyForecast': hourly_forecast,
                'dailyForecast': daily_forecast,
                'icon': weatherIcon,
                'conditions': {
                    'cloudiness': current_data.get('clouds', {}).get('all', 0),
                    'rain_1h': current_data['percipitation']['percent'],
                    'snow_1h': current_data.get('snow', {}).get('1h', 0)
                }
            }
            
        except Exception as e:
            logger.error(f"Error formatting weather data: {str(e)}")
            return self._get_fallback_weather_data(location)
    
    def _map_weather_icon(self, openweather_icon: str) -> str:
        """Map OpenWeatherMap icons to our icon system"""
        icon_mapping = {
            '01d': 'sun',        # clear sky day
            '01n': 'moon',       # clear sky night
            '02d': 'cloud-sun',  # few clouds day
            '02n': 'cloud-moon', # few clouds night
            '03d': 'cloud',      # scattered clouds
            '03n': 'cloud',      # scattered clouds
            '04d': 'cloud',      # broken clouds
            '04n': 'cloud',      # broken clouds
            '09d': 'cloud-rain', # shower rain
            '09n': 'cloud-rain', # shower rain
            '10d': 'cloud-rain', # rain day
            '10n': 'cloud-rain', # rain night
            '11d': 'cloud-lightning', # thunderstorm
            '11n': 'cloud-lightning', # thunderstorm
            '13d': 'cloud-snow', # snow
            '13n': 'cloud-snow', # snow
            '50d': 'cloud',      # mist
            '50n': 'cloud',      # mist
        }
        
        return icon_mapping.get(openweather_icon, 'cloud')
    
    def _extract_location_from_message(self, message: str, context: Dict[str, Any] = None) -> Optional[str]:
        """Extract location from message or context"""
        # Check context first
        if context and 'location' in context:
            return context['location']
        
        # Simple location extraction - could be improved with NLP
        message_lower = message.lower()
        
        # Look for common location patterns
        location_keywords = ['in ', 'at ', 'for ', 'weather in ', 'forecast for ', 'temperature in ']
        for keyword in location_keywords:
            if keyword in message_lower:
                parts = message_lower.split(keyword)
                if len(parts) > 1:
                    potential_location = parts[1].split()[0:3]  # Take up to 3 words
                    return ' '.join(potential_location).strip('.,!?')
        
        return None
    
    def _generate_weather_recommendations(self, weather_data: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on weather conditions"""
        recommendations = []
        
        if not weather_data:
            return ["Unable to provide weather-based recommendations."]
        
        temp = weather_data.get('temperature', 20)
        description = weather_data.get('description', '').lower()
        humidity = weather_data.get('humidity', 50)
        wind_speed = weather_data.get('windSpeed', 0)
        
        # Temperature-based recommendations
        if temp > 30:
            recommendations.append("🌡️ Very hot weather - stay hydrated, wear sunscreen, and seek shade during peak hours")
        elif temp > 25:
            recommendations.append("☀️ Great weather for outdoor activities and sightseeing!")
        elif temp > 15:
            recommendations.append("🌤️ Pleasant weather - perfect for walking tours and outdoor dining")
        elif temp > 5:
            recommendations.append("🧥 Cool weather - bring a jacket for outdoor activities")
        else:
            recommendations.append("❄️ Cold weather - dress warmly and consider indoor attractions")
        
        # Precipitation recommendations
        if 'rain' in description or 'drizzle' in description:
            recommendations.append("🌧️ Rain expected - bring an umbrella and have backup indoor plans")
        elif 'snow' in description:
            recommendations.append("🌨️ Snow conditions - wear appropriate footwear and warm clothing")
        elif 'clear' in description or 'sunny' in description:
            recommendations.append("🌞 Clear skies - perfect for photography and outdoor exploration")
        
        # Humidity recommendations
        if humidity > 80:
            recommendations.append("💧 High humidity - wear breathable fabrics and stay cool")
        elif humidity < 30:
            recommendations.append("🏜️ Low humidity - stay hydrated and use moisturizer")
        
        # Wind recommendations
        if wind_speed > 30:
            recommendations.append("💨 Strong winds - be cautious with outdoor activities and flying objects")
        elif wind_speed > 15:
            recommendations.append("🌬️ Windy conditions - secure loose items and dress accordingly")
        
        # Activity recommendations based on conditions
        if temp > 20 and temp < 30 and 'clear' in description:
            recommendations.append("🎯 Perfect conditions for outdoor sports and beach activities")
        elif 'cloud' in description and temp > 15:
            recommendations.append("📸 Great lighting for photography with soft, diffused clouds")
        
        return recommendations
    
    def _get_fallback_weather_data(self, location: str) -> Dict[str, Any]:
        """Return fallback weather data when API is not available"""
        logger.warning(f"Using fallback weather data for {location}")
        
        return {
            'location': location,
            'temperature': 18,
            'description': 'Weather data unavailable',
            'humidity': 65,
            'windSpeed': 12,
            'visibility': 10,
            'feelsLike': 20,
            'pressure': 1013,
            'uvIndex': 0,
            'sunrise': '06:30',
            'sunset': '19:45',
            'icon': 'cloud',
            'hourlyForecast': [
                {'time': '15:00', 'temperature': 19, 'icon': 'sun', 'description': 'Clear'},
                {'time': '18:00', 'temperature': 18, 'icon': 'cloud', 'description': 'Cloudy'},
                {'time': '21:00', 'temperature': 17, 'icon': 'cloud-sun', 'description': 'Partly Cloudy'},
                {'time': '00:00', 'temperature': 16, 'icon': 'cloud-rain', 'description': 'Light Rain'},
            ],
            'dailyForecast': [
                {'date': '2024-01-01', 'day_name': 'Today', 'max_temp': 20, 'min_temp': 15, 'description': 'Partly Cloudy', 'icon': 'cloud-sun'},
                {'date': '2024-01-02', 'day_name': 'Tomorrow', 'max_temp': 22, 'min_temp': 16, 'description': 'Sunny', 'icon': 'sun'},
                {'date': '2024-01-03', 'day_name': 'Wednesday', 'max_temp': 19, 'min_temp': 14, 'description': 'Rainy', 'icon': 'cloud-rain'},
            ],
            'conditions': {
                'cloudiness': 50,
                'rain_1h': 0,
                'snow_1h': 0
            },
            'error': 'Weather API unavailable - showing fallback data'
        }
