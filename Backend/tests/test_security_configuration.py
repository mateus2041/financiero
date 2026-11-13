import os
from pathlib import Path
import subprocess
import sys

import pytest


PROJECT_ROOT = Path(__file__).resolve().parents[2]


@pytest.mark.parametrize(
    ("app_env", "secret_key", "expected_status"),
    [
        ("development", "", 0),
        ("production", "", 1),
        ("production", "short", 1),
        ("production", "test-only-" + "x" * 40, 0),
    ],
)
def test_jwt_secret_configuration(app_env, secret_key, expected_status):
    environment = os.environ.copy()
    environment.update(
        {
            "APP_ENV": app_env,
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
