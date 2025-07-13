from google.adk.agents import Agent
from dotenv import load_dotenv
import os

load_dotenv()

root_agent = Agent(
    name="tripPlannerAgent",
    model="gemini-2.0-flash",
    description="A sub-agent that takes tourist spots and plans a trip for a given duration.",
    instruction="""
    You are a Trip Planner agent. Your task is to use tourist spots and plan a trip for a given duration.
    You have access to the following tools:
    If the agent cannot resolve the request, Delegate the request back to the Supervisor agent.
    """,
    tools=[],
)