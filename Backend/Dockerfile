FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:0.8.22 /uv /uvx /bin/

WORKDIR /app

ENV PYTHONPATH=/app \
    UV_LINK_MODE=copy \
    UV_HTTP_TIMEOUT=120 \
    VIRTUAL_ENV=/opt/backend-venv \
    PATH="/opt/backend-venv/bin:$PATH"

COPY Backend/requirements.txt ./Backend/requirements.txt
RUN uv venv /opt/backend-venv \
    && uv pip install --python /opt/backend-venv/bin/python -r Backend/requirements.txt

COPY Backend/ ./Backend/

EXPOSE 8000

CMD ["uvicorn", "Backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]