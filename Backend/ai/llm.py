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

OPENAI_API_KEY = os.getenv(
    "OPENAI_API_KEY"
)



if not OPENAI_API_KEY:

    raise Exception(
        "ERROR: No se encontró OPENAI_API_KEY en el archivo .env"
    )



# =========================
# MODELO OPENAI
# =========================

llm = ChatOpenAI(

    model="gpt-4.1-mini",

    temperature=0.3,

    api_key=OPENAI_API_KEY

)