"""
Location Agent - Specializes in finding tourist attractions and points of interest
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional
import os
import json
import requests
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class TouristSpot:
    id: str
    name: str
    description: str
    latitude: float
    longitude: float
    rating: float
    address: str
    distance: float
    photo_url: str
    types: List[str]

class LocationAgent:
    """
    Agent specialized in finding tourist attractions using Google Places API
    """
    
    def __init__(self):
        self.google_api_key = os.getenv('GOOGLE_MAPS_API_KEY')
        self.places_base_url = os.getenv('GOOGLE_MAPS_BASE_URL')
        self.ready = False
        
    async def initialize(self):
        """Initialize the tourist agent"""
        try:
            logger.info("Initializing Tourist Agent...")
            
            if not self.google_api_key:
                logger.warning("Google Maps API key not found. Using mock data.")
                
            self.ready = True
            logger.info("Tourist Agent initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Tourist Agent: {str(e)}")
            raise
    
    def is_ready(self) -> bool:
        """Check if the tourist agent is ready"""
        return self.ready
    
    async def process_message(self, message: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process a message about tourist attractions"""
        try:
            logger.info(f"Tourist agent processing message: {message}")
            
            # Extract location from message or context
            location = self._extract_location_from_message(message, context)
            
            if location:
                spots = await self.find_tourist_spots(location=location)
                return {
                    "agent": "tourist",
                    "message": f"I found {len(spots)} tourist attractions near {location}",
                    "spots": spots,
                    "recommendations": self._generate_spot_recommendations(spots)
                }
            else:
                return {
                    "agent": "tourist",
                    "message": "I can help you find amazing tourist attractions! Please tell me the location you're interested in visiting.",
                    "suggestions": [
                        "Ask me about tourist spots in any city",
                        "I can find attractions, museums, landmarks, and more",
                        "Just mention a location and I'll find the best places to visit"
                    ]
                }
                
        except Exception as e:
            logger.error(f"Error processing message in tourist agent: {str(e)}")
            return {
                "error": "Failed to process message",
                "message": "I'm having trouble finding tourist information. Please try again."
            }
    
    async def find_tourist_spots(self, location: str, latitude: float = None, longitude: float = None, 
                                radius_km: float = 50.0, max_results: int = 20) -> List[Dict[str, Any]]:
        """
        Find tourist spots near a location using Google Places API
        """
        try:
            logger.info(f"Finding tourist spots near: {location}")
            
            # If we have coordinates, use them directly
            if latitude and longitude:
                return await self._search_places_by_coordinates(latitude, longitude, radius_km, max_results)
            
            # Otherwise, geocode the location first
            coords = await self._geocode_location(location)
            if coords:
                return await self._search_places_by_coordinates(coords['lat'], coords['lng'], radius_km, max_results)
            
            # Fallback to mock data if API is not available
            return self._get_mock_tourist_spots(location)
            
        except Exception as e:
            logger.error(f"Error finding tourist spots: {str(e)}")
            return self._get_mock_tourist_spots(location)
    
    async def _geocode_location(self, location: str) -> Optional[Dict[str, float]]:
        """Convert location name to coordinates"""
        try:
            if not self.google_api_key:
                return None
            
            url = "https://maps.googleapis.com/maps/api/geocode/json"
            params = {
                'address': location,
                'key': self.google_api_key
            }
            
            response = requests.get(url, params=params)
            data = response.json()
            if data['status'] == 'OK' and data['results']:
                location_data = data['results'][0]['geometry']['location']
                return {
                    'lat': location_data['lat'],
                    'lng': location_data['lng']
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error geocoding location: {str(e)}")
            return None
    
    async def _search_places_by_coordinates(self, latitude: float, longitude: float, 
                                          radius_km: float, max_results: int) -> List[Dict[str, Any]]:
        """Search for places using coordinates"""
        try:
            if not self.google_api_key:
                return self._get_mock_tourist_spots(f"{latitude},{longitude}")
            
            # Convert km to meters
            radius_meters = int(radius_km * 1000)
            
            # Search for tourist attractions
            url = f"{self.places_base_url}/nearbysearch/json"
            params = {
                'location': f"{latitude},{longitude}",
                'radius': radius_meters,
                'type': 'tourist_attraction',
                'key': self.google_api_key
            }
            response = requests.get(url, params=params)
            logger.info(f"Response: {response}")
            data = response.json()
            
            spots = []
            if data['status'] == 'OK':
                for place in data.get('results', [])[:max_results]:
                    spot = self._format_place_data(place, latitude, longitude)
                    if spot:
                        spots.append(spot)
            
            # If we don't have enough tourist attractions, search for points of interest
            if len(spots) < max_results // 2:
                params['type'] = 'point_of_interest'
                response = requests.get(url, params=params)
                data = response.json()
                
                if data['status'] == 'OK':
                    for place in data.get('results', []):
                        if len(spots) >= max_results:
                            break
                        spot = self._format_place_data(place, latitude, longitude)
                        if spot and not any(s['id'] == spot['id'] for s in spots):
                            spots.append(spot)
            
            return spots
            
        except Exception as e:
            logger.error(f"Error searching places: {str(e)}")
            return self._get_mock_tourist_spots(f"{latitude},{longitude}")
    
    def _format_place_data(self, place: Dict, ref_lat: float, ref_lng: float) -> Optional[Dict[str, Any]]:
        """Format Google Places API response into our format"""
        try:
            place_lat = place['geometry']['location']['lat']
            place_lng = place['geometry']['location']['lng']
            
            # Calculate distance
            distance = self._calculate_distance(ref_lat, ref_lng, place_lat, place_lng)
            
            # Get photo URL if available
            photo_url = None
            if place.get('photos'):
                photo_reference = place['photos'][0]['photo_reference']
                photo_url = f"{self.places_base_url}/photo?maxwidth=400&photoreference={photo_reference}&key={self.google_api_key}"
            
            return {
                'id': place['place_id'],
                'name': place['name'],
                'description': place.get('vicinity', ''),
                'latitude': place_lat,
                'longitude': place_lng,
                'rating': place.get('rating', 0),
                'address': place.get('vicinity', ''),
                'distance': round(distance, 2),
                'photo_url': photo_url,
                'types': place.get('types', []),
                'price_level': place.get('price_level'),
                'user_ratings_total': place.get('user_ratings_total', 0)
            }
            
        except Exception as e:
            logger.error(f"Error formatting place data: {str(e)}")
            return None
    
    def _calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance between two points in kilometers"""
        import math
        
        # Convert to radians
        lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
        c = 2 * math.asin(math.sqrt(a))
        r = 6371  # Earth's radius in kilometers
        
        return c * r
    
    def _extract_location_from_message(self, message: str, context: Dict[str, Any] = None) -> Optional[str]:
        """Extract location from message or context"""
        # Simple location extraction - could be improved with NLP
        message_lower = message.lower()
        
        # Check context first
        if context and 'location' in context:
            return context['location']
        
        # Look for common location patterns
        location_keywords = ['in ', 'at ', 'near ', 'around ', 'visit ', 'go to ']
        for keyword in location_keywords:
            if keyword in message_lower:
                parts = message_lower.split(keyword)
                if len(parts) > 1:
                    potential_location = parts[1].split()[0:3]  # Take up to 3 words
                    return ' '.join(potential_location).strip('.,!?')
        
        return None
    
    def _generate_spot_recommendations(self, spots: List[Dict[str, Any]]) -> List[str]:
        """Generate recommendations based on found spots"""
        recommendations = []
        
        if not spots:
            return ["No tourist spots found in this area."]
        
        # Top rated spots
        top_rated = sorted(spots, key=lambda x: x.get('rating', 0), reverse=True)[:3]
        for spot in top_rated:
            recommendations.append(f"Highly rated: {spot['name']} ({spot.get('rating', 'N/A')} stars)")
        
        # Closest spots
        closest = sorted(spots, key=lambda x: x.get('distance', float('inf')))[:2]
        for spot in closest:
            recommendations.append(f"Nearby: {spot['name']} ({spot.get('distance', 'N/A')} km away)")
        
        return recommendations
    
    def _get_mock_tourist_spots(self, location: str) -> List[Dict[str, Any]]:
        """Return mock tourist spots when API is not available"""
        return [
            {
                'id': 'mock_1',
                'name': 'Historic Downtown',
                'description': 'Beautiful historic district with shops and restaurants',
                'latitude': 37.7749,
                'longitude': -122.4194,
                'rating': 4.5,
                'address': 'Downtown Area',
                'distance': 1.2,
                'photo_url': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
                'types': ['tourist_attraction'],
                'user_ratings_total': 1250
            },
            {
                'id': 'mock_2',
                'name': 'City Museum',
                'description': 'Local history and culture museum',
                'latitude': 37.7849,
                'longitude': -122.4094,
                'rating': 4.2,
                'address': 'Museum District',
                'distance': 2.1,
                'photo_url': 'https://images.unsplash.com/photo-1518837695005-2083093ee35b',
                'types': ['museum'],
                'user_ratings_total': 890
            },
            {
                'id': 'mock_3',
                'name': 'Scenic Overlook',
                'description': 'Panoramic views of the city',
                'latitude': 37.7649,
                'longitude': -122.4294,
                'rating': 4.7,
                'address': 'Hilltop Drive',
                'distance': 3.5,
                'photo_url': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29',
                'types': ['tourist_attraction', 'point_of_interest'],
                'user_ratings_total': 2100
            }
        ]
