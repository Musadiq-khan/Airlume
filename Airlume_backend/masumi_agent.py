from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import anthropic
import os
from typing import Optional

app = FastAPI(title="AIRLUME Masumi Agent")

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Anthropic client (for Claude AI)
client = anthropic.Anthropic()

class ChatRequest(BaseModel):
    message: str
    aqi: int
    temperature: float
    humidity: float
    pm25: float
    gas: float
    trend: str

class ChatResponse(BaseModel):
    response: str
    agent_id: str = "airlume-masumi-001"

@app.get("/")
async def root():
    return {
        "service": "AIRLUME Masumi AI Agent",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/input_schema")
async def input_schema():
    """MIP-003 compliant input schema"""
    return {
        "type": "object",
        "properties": {
            "message": {"type": "string", "description": "User question about air quality"},
            "aqi": {"type": "integer", "description": "Current Air Quality Index"},
            "temperature": {"type": "number", "description": "Temperature in Celsius"},
            "humidity": {"type": "number", "description": "Humidity percentage"},
            "pm25": {"type": "number", "description": "PM2.5 in µg/m³"},
            "gas": {"type": "number", "description": "Gas sensor reading"},
            "trend": {"type": "string", "description": "Air quality trend"}
        },
        "required": ["message"]
    }

@app.get("/availability")
async def availability():
    """Check if agent is available"""
    return {"available": True, "status": "ready"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    AI chat endpoint with sensor context
    """
    try:
        # Construct prompt with sensor data
        system_prompt = f"""You are Masumi AI, an intelligent air quality monitoring assistant for AIRLUME.

Current Sensor Readings:
- AQI: {request.aqi} ({get_aqi_category(request.aqi)})
- Temperature: {request.temperature}°C
- Humidity: {request.humidity}%
- PM2.5: {request.pm25} µg/m³
- Gas Sensor: {request.gas} ppb
- Trend: {request.trend}

Provide helpful insights about:
- Air quality health impacts
- Recommendations based on current readings
- Explanations of sensor data
- Safety guidelines
- Trend predictions

Be concise, helpful, and focus on actionable advice."""

        # Call Claude API
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=512,
            messages=[{
                "role": "user",
                "content": request.message
            }],
            system=system_prompt
        )
        
        response_text = message.content[0].text
        
        return ChatResponse(
            response=response_text,
            agent_id="airlume-masumi-001"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_aqi_category(aqi: int) -> str:
    """Convert AQI to health category"""
    if aqi <= 50:
        return "Good"
    elif aqi <= 100:
        return "Moderate"
    elif aqi <= 150:
        return "Unhealthy for Sensitive Groups"
    elif aqi <= 200:
        return "Unhealthy"
    elif aqi <= 300:
        return "Very Unhealthy"
    else:
        return "Hazardous"

@app.post("/analyze")
async def analyze_trends(data: dict):
    """Analyze historical air quality trends"""
    try:
        # Use Claude to analyze patterns
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[{
                "role": "user",
                "content": f"""Analyze this air quality data and provide insights:
                
{data}

Identify:
1. Patterns and trends
2. Potential causes of changes
3. Health recommendations
4. Preventive actions"""
            }]
        )
        
        return {"analysis": message.content[0].text}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)