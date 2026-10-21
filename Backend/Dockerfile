FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:0.8.22 /uv /uvx /bin/

WORKDIR /app

ENV PYTHONPATH=/app \
    UV_LINK_MODE=copy

COPY Backend/requirements.txt ./requirements.txt
RUN uv pip install --system -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "Backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]