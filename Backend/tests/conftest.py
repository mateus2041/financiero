import os


os.environ.setdefault(
    "JWT_SECRET_KEY",
    "test-only-secret-key-that-is-at-least-32-characters",
)
os.environ.setdefault("PYTHON_DOTENV_DISABLED", "1")
