from .llm import llm
from .prompt import prompt

chain = prompt | llm if llm is not None else None if llm is not None else None