#!/bin/bash

# setup-bot.sh - Скрипт для настройки Telegram бота

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🤖 Настройка AutoParts Telegram Bot${NC}"
echo "======================================"

# Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo -e "${RED}❌ Файл .env не найден!${NC}"
    echo "Скопируйте .env.example в .env и заполните переменные:"
    echo "cp .env.example .env"
    exit 1
fi

# Загружаем переменные окружения
source .env

# Проверяем переменные
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo -e "${RED}❌ TELEGRAM_BOT_TOKEN не установлен в .env${NC}"
    exit 1
fi

if [ -z "$VERCEL_URL" ]; then
    echo -e "${YELLOW}⚠️ VERCEL_URL не установлен. Введите URL вашего Vercel проекта:${NC}"
    read -p "https://" VERCEL_URL
    VERCEL_URL="https://$VERCEL_URL"
fi

echo -e "${BLUE}🔧 Настройка webhook...${NC}"

# Устанавливаем webhook
WEBHOOK_URL="$VERCEL_URL/api/webhook"
RESPONSE=$(curl -s -F "url=$WEBHOOK_URL" \
  "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook")

echo "Ответ от Telegram API: $RESPONSE"

# Проверяем статус webhook
echo -e "${BLUE}📊 Проверка статуса webhook...${NC}"
STATUS=$(curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo")
echo "$STATUS" | python3 -m json.tool 2>/dev/null || echo "$STATUS"

# Проверяем информацию о боте
echo -e "${BLUE}ℹ️ Информация о боте:${NC}"
BOT_INFO=$(curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe")
echo "$BOT_INFO" | python3 -m json.tool 2>/dev/null || echo "$BOT_INFO"

echo -e "${GREEN}✅ Настройка завершена!${NC}"
echo -e "${YELLOW}Теперь найдите вашего бота в Telegram и отправьте /start${NC}"
