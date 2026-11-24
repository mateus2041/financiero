import os
from pathlib import Path
import subprocess
import sys

import pytest


PROJECT_ROOT = Path(__file__).resolve().parents[2]


@pytest.mark.parametrize(
    ("app_env", "jwt_secret_key", "secret_key", "expected_status"),
    [
        ("development", "", "", 0),
        ("production", "", "", 1),
        ("production", "short", "", 1),
        ("production", "test-only-" + "x" * 40, "", 0),
        ("production", "", "test-only-" + "x" * 40, 0),
    ],
)
def test_jwt_secret_configuration(
    app_env, jwt_secret_key, secret_key, expected_status
):
    environment = os.environ.copy()
    environment.update(
        {
            "APP_ENV": app_env,
            "JWT_SECRET_KEY": jwt_secret_key,
            "SECRET_KEY": secret_key,
            "PYTHON_DOTENV_DISABLED": "1",
            "PYTHONPATH": str(PROJECT_ROOT),
        }
    )
    result = subprocess.run(
        [sys.executable, "-c", "import Backend.security"],
        cwd=PROJECT_ROOT,
        env=environment,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == expected_status


def test_jwt_token_is_valid_in_a_new_process():
    environment = os.environ.copy()
    environment.update(
        {
            "APP_ENV": "production",
            "JWT_SECRET_KEY": "test-only-secret-key-that-is-at-least-32-characters",
            "SECRET_KEY": "",
            "PYTHON_DOTENV_DISABLED": "1",
            "PYTHONPATH": str(PROJECT_ROOT),
        }
    )
    token = subprocess.run(
        [
            sys.executable,
            "-c",
            "from Backend.security import generate_token; print(generate_token(42))",
        ],
        cwd=PROJECT_ROOT,
        env=environment,
        capture_output=True,
        text=True,
        check=True,
    ).stdout.strip()
    validation = subprocess.run(
        [
            sys.executable,
            "-c",
            "import sys; from fastapi.security import HTTPAuthorizationCredentials; "
            "from Backend.security import token_required; "
            "print(token_required(HTTPAuthorizationCredentials("
            "scheme='Bearer', credentials=sys.argv[1])))",
            token,
        ],
        cwd=PROJECT_ROOT,
        env=environment,
        capture_output=True,
        text=True,
        check=True,
    )

    assert validation.stdout.strip() == "42"
