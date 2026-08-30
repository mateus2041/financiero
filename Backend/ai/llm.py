import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI


# =========================
# CARGAR VARIABLES .ENV
# =========================

load_dotenv()


# =========================
# OBTENER API KEY
# =========================

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


# =========================
# MODELO OPENAI
# =========================

if OPENAI_API_KEY:
    llm = ChatOpenAI(
        model="gpt-4.1-mini",
        temperature=0.3,
        api_key=OPENAI_API_KEY,
    )
else:
    llm = None