from google.adk.agents import Agent
from dotenv import load_dotenv
import os

load_dotenv()

root_agent = Agent(
    name="bookingAgent",
    model="gemini-2.0-flash",
    description="A sub-agent that books hotels and flights and deals with other travel-related queries.",
    instruction="""
    You are a Booking Agent agent. Your task is to book flights and hotels for the agent.
    You have access to the following tools:
    If the agent cannot resolve the request, Delegate the request back to the Supervisor agent.
    """,
    tools=[],
)