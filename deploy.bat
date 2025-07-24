@echo off
echo 🚀 Автоматический деплой AutoParts Bot

echo 📁 Переходим в папку проекта...
cd /d D:\Parts_API

echo 🔧 Проверяем Git...
git --version
if errorlevel 1 (
    echo ❌ Git не установлен! Скачайте с https://git-scm.com/
    pause
    exit /b 1
)

echo 📋 Инициализируем Git репозиторий...
git init

echo 📝 Добавляем все файлы...
git add .

echo 💾 Делаем первый коммит...
git commit -m "Initial AutoParts Telegram Bot - Perplexity AI integration"

echo 🌐 Теперь нужно:
echo 1. Создать репозиторий на GitHub.com
echo 2. Скопировать команды ниже:
echo.
echo git remote add origin https://github.com/ВАШ_USERNAME/autoparts-bot.git
echo git branch -M main  
echo git push -u origin main
echo.
pause

echo 📡 Устанавливаем Vercel CLI...
npm install -g vercel

echo ☁️ Деплоим на Vercel...
vercel --prod

echo ✅ Готово! Не забудьте настроить переменные окружения в Vercel Dashboard
pause
