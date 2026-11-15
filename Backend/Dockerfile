FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:0.8.22 /uv /uvx /bin/

WORKDIR /app

RUN groupadd --system app && useradd --system --gid app --create-home app

ENV PYTHONPATH=/app \
    UV_LINK_MODE=copy \
    UV_HTTP_TIMEOUT=120 \
    VIRTUAL_ENV=/opt/backend-venv \
    PATH="/opt/backend-venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY Backend/requirements.lock ./Backend/requirements.lock
RUN uv venv /opt/backend-venv \
    && uv pip install --python /opt/backend-venv/bin/python --only-binary :all: --require-hashes -r Backend/requirements.lock

COPY --chown=app:app Backend/ ./Backend/

EXPOSE 8000

USER app

CMD ["uvicorn", "Backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]