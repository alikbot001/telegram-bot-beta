#!/bin/bash
while true; do
    echo "Запуск бота..."
    node bot.mjs  # или index.js, если у тебя другой файл
    echo "Бот упал! Перезапуск через 5 сек..."
    sleep 5
done