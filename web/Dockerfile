# Простой образ для этапа 1. Уменьшать и оптимизировать будем на этапе 8 (деплой).
FROM node:22-slim

WORKDIR /app
# Не отправлять анонимную статистику Next.js на серверы Vercel
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build && chown -R node:node /app/.next

USER node
EXPOSE 3000
# Перед запуском применяем миграции базы
CMD ["sh", "-c", "npm run db:migrate && npm run start"]
