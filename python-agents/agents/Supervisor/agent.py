from google.adk.agents import Agent
from .sub_agents.googleMapsAgent.agent import googleMapsAgent
from .sub_agents.tripPlannerAgent.agent import tripPlannerAgent
from .sub_agents.bookingAgent.agent import bookingAgent

root_agent= Agent(
    name="Supervisor",
    model="gemini-2.0-flash",
    description="A supervisor agent that coordinates other agents to provide travel-related information.",
    instruction="""
    You are a Supervisor agent. Your task is to greet, convere and satisfy the user and complete their requests by interacting with the sub agents available if necessary.
    You can access the following sub-agents:
    - `GoogleMapsAgent`: Find tourist spots, weather or any location related or weather related field for a given location name.
    - `TripPlannerAgent`: A sub-agent that helps to plan a trip to a given location name.
    - `BookingAgent`: A sub-agent that gets information about and helps to book hotels, flights, and other travel-related services.
    """,
    sub_agents=[googleMapsAgent, tripPlannerAgent, bookingAgent],
)