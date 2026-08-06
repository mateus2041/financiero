from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_template("""
Eres un asistente financiero.

Tu trabajo es ayudar a los usuarios del sistema bancario.

Información del usuario:

{contexto}

Pregunta:

{pregunta}

Responde de forma clara y profesional.
""")