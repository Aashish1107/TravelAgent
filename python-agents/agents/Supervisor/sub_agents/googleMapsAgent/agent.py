from google.adk.agents import Agent
from dotenv import load_dotenv
import os

load_dotenv()
apiKey= os.getenv("GOOGLE_MAPS_API_KEY")
baseURL = os.getenv("GOOGLE_MAPS_BASE_URL")

def find_tourist_spots(latitude: float, longitude: float, radius_km: int, max_results: int)-> list:
    """
    Find tourist spots for a given location name within a specified radius.
    """
    return []

def get_weather_info(latitude: float, longitude: float) -> dict:
    """
    Get weather information for a given location name.
    """
    return {}

def geocode_location(location_name: str) -> dict:
    """
    Geocode a location name to get its latitude and longitude.
    """
    # Example implementation, replace with actual API call
    if location_name:
        return {
            "latitude": 0.0,
            "longitude": 0.0,
        }
root_agent = Agent(
    name="googleMapsAgent",
    model="gemini-2.0-flash",
    description="A sub-agent that interacts with Google Maps to find tourist spots, weather, or any location-related information.",
    instruction="""
    You are a Google Maps agent. Your task is to find tourist spots, weather, or any location-related information or weather-related information for a given location name.
    You have access to the following tools:
    - `find_tourist_spots`: Find tourist spots for given latitude and Longitude.
    - `get_weather_info`: Get weather information for a given latitude and Longitude.
    - `geocode_location`: Geocode a location name to get its latitude and longitude.
    
    If the agent cannot resolve the request, Delegate the request back to the Supervisor agent.
    """,
    tools=[find_tourist_spots, get_weather_info, geocode_location],
)