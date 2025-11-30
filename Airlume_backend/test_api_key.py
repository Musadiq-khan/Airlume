# test_api_key.py
from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.getenv('ANTHROPIC_API_KEY')

if api_key:
    print("✅ API Key loaded successfully!")
    print(f"Key starts with: {api_key[:15]}...")
else:
    print("❌ API Key not found!")