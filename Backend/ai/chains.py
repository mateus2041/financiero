from .llm import llm
from .prompt import prompt

chain = prompt | llm