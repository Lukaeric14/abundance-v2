import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

PORT = int(os.getenv("PORT", "8080"))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5-nano")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE = os.getenv("SUPABASE_service_role")
CSV_LOG_DIR = os.getenv("CSV_LOG_DIR", "./logs")

assert OPENAI_API_KEY and SUPABASE_URL and SUPABASE_SERVICE_ROLE, "Missing required env vars."
os.makedirs(CSV_LOG_DIR, exist_ok=True)