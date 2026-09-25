"""Сервис проверки ответов.

Без состояния: получает задачу и ответ, возвращает вердикт в JSON.
В базу не ходит. Пока здесь только проверка, что сервис жив.
"""

from fastapi import FastAPI

app = FastAPI(title="checker")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
