from google.adk.agents import Agent
from ..location_agent import LocationAgent
root_agent= Agent(
    name="googleMaps_agent",
    model="gemini-2.0-flash",
    description="Agent for interacting with Google Maps API to find tourist spots, routes, and locations.",
    instruction="""
    You are a Google Maps agent. Your task is to interact with the Google Maps API to find tourist spots, routes, and locations based on the user's query.
    You can access the following tools:
    - `get_tourist_spots`: Find tourist spots for a given location name.
    - `_geocode_location`: Geocode a location name to get its latitude and longitude.
    """,
    tools=[LocationAgent.process_message, LocationAgent._geocode_location],
)