# Платформа подготовки по математике и физике

Описание проекта и правила - в [CLAUDE.md](CLAUDE.md).
Принятые решения - в [docs/decisions.md](docs/decisions.md).

## Структура

- `web/` - сайт (Next.js): база, вход, вся бизнес-логика
- `checker/` - сервис проверки ответов (Python, FastAPI)
- `docs/` - документация

## Что нужно установить

- Docker Desktop (или Docker Engine с docker compose)
- Node.js 22 - для разработки сайта
- Python 3.12 - для разработки checker

## Настройка

```bash
cp .env.example .env
```

В `.env` поменяйте:
- `POSTGRES_PASSWORD` и тот же пароль внутри `DATABASE_URL`;
- `AUTH_SECRET` - сгенерируйте командой `openssl rand -base64 32`;
- `ADMIN_LOGIN`, `ADMIN_PASSWORD` (не короче 10 символов), `ADMIN_FIRST_NAME`,
  `ADMIN_LAST_INITIAL` - данные первого администратора.

## Запуск всего через docker compose

```bash
docker compose up --build -d
docker compose exec web npm run seed:admin   # один раз: создать администратора
```

- сайт: http://localhost:3000
- checker: http://localhost:8000/health

Миграции базы применяются автоматически при старте web.
Остановить: `docker compose down` (данные базы сохраняются).

## Разработка сайта (без пересборки docker-образа)

```bash
docker compose up -d db        # только база
cd web
npm install
npm run db:migrate             # применить миграции
npm run seed:admin             # создать администратора (один раз)
npm run dev                    # http://localhost:3000
```

Команды `web/`:

| Команда | Что делает |
| --- | --- |
| `npm run dev` | сайт в режиме разработки |
| `npm test` | юнит-тесты (vitest) |
| `npm run lint` | проверка кода (eslint) |
| `npm run db:generate` | создать миграцию после изменения `src/db/schema.ts` |
| `npm run db:migrate` | применить миграции |
| `npm run db:studio` | посмотреть базу в браузере |
| `npm run seed:admin` | создать администратора из `.env` |

Все команды читают общий `.env` из корня (через `scripts/with-env.mjs`).

## Разработка checker

```bash
cd checker
python3.12 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/pytest
.venv/bin/uvicorn app.main:app --reload   # http://localhost:8000/health
```

## Ручная проверка этапа 1

1. Войти администратором на http://localhost:3000 - откроется список пользователей.
2. "Создать пользователя" - ученик, класс 10. Запомнить показанный пароль.
3. Создать родителя. В карточке ученика привязать родителя.
4. В другом браузере (или окне инкогнито) войти учеником - виден экран
   "Ждём согласия родителя".
5. Администратором отметить согласие в карточке ученика. Ученику обновить
   страницу - видно "Задания".
6. Сбросить ученику пароль - ученика выкинет на страницу входа при обновлении,
   войти можно только с новым паролем.
7. Заблокировать ученика - его сразу выкидывает, войти он не может.
8. Ученик, открывающий `/admin/users`, попадает обратно в свой раздел.
