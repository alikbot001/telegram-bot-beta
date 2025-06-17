const { Telegraf, Markup } = require('telegraf');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const schedule = require('node-schedule');
const dayjs = require('dayjs');

const BOT_TOKEN = '7804238972:AAGexNGm0WbKRUNHM1jRWsqkxQzg3-6lMt4';

const MOTIVATION_QUOTES = [
    "Великие дела начинаются с малого.",
    "Секрет продвижения вперед — начать.",
    "Дорогу осилит идущий.",
    "Только тот, кто идет слишком далеко, узнает, как далеко можно зайти.",
    "Смелость — это начало действия, удача — его завершение.",
    "Не ошибается тот, кто ничего не делает.",
    "Падая, мы учимся подниматься.",
    "Терпение и труд всё перетрут.",
    "Сделай сегодня то, что другие не хотят — завтра будешь жить так, как другие не могут.",
    "Путь в тысячу ли начинается с первого шага.",
    // ...добавьте свои цитаты сюда (до 500 и более)...
];

const WEEKLY_CHECKLIST = [
    {
        title: "ПОНЕДЕЛЬНИК — Психология влияния (~60 мин)",
        tasks: [
            "Смотреть видео/лекцию о манипуляциях (30 мин)",
            "Подумать: где я с этим сталкивался? (10 мин)",
            "Записать: в чём я умею влиять? (10 мин)",
            "Медитация или дыхание (по желанию, 5 мин)",
        ]
    },
    {
        title: "ВТОРНИК — Финансовое мышление (~60–75 мин)",
        tasks: [
            "Смотреть видео / читать статью про мышление богатства (30 мин)",
            "Ответить письменно: как бы я потратил 10.000₽? (15 мин)",
            "Подумать: что я делаю правильно с деньгами? (5 мин)",
            "Чек-ин: как я себя чувствую сейчас? (5 мин)",
        ]
    },
    {
        title: "СРЕДА — Уверенность и речь (~60 мин)",
        tasks: [
            "Смотреть TED / выступление с харизмой (20 мин)",
            "Записать себя: как прошли 3 дня (2 мин)",
            "Проанализировать: что звучало уверенно? (10 мин)",
            "Выучить 5 сильных слов",
            "Проговорить: «Что я думаю о себе» (5 мин)",
        ]
    },
    {
        title: "ЧЕТВЕРГ — Кодинг / логика (~60–75 мин)",
        tasks: [
            "Пройти мини-урок по Python / визуальному кодингу (30 мин)",
            "Записать, что понял (10 мин)",
            "Подумать: что бы хотел создать? (10 мин)",
            "Прогулка или чай (отдых)",
        ]
    },
    {
        title: "ПЯТНИЦА — Спокойствие и самоанализ (~60 мин)",
        tasks: [
            "Медитация под эмбиент / тихая музыка (10 мин)",
            "Написать: — что почувствовал? — где был честен с собой? — где осудил себя — и зачем?",
            "Прогулка или отдых в тишине (15 мин)",
            "Музыка, которая лечит (15 мин)",
        ]
    },
    {
        title: "СУББОТА — Эстетика и вкус (~60–75 мин)",
        tasks: [
            "Смотреть красивое видео / монтаж / дизайн (15 мин)",
            "Подумать: что именно понравилось? (10 мин)",
            "Сохранить 3 идеи (в Telegram/папку)",
            "Придумать 1 идею для TikTok/канала",
            "Писать как хочется (ручкой / в заметках)",
        ]
    },
    {
        title: "ВОСКРЕСЕНЬЕ — Рефлексия и перезагрузка (~60 мин)",
        tasks: [
            "Написать: — что я понял о себе за неделю? — что получилось, что было трудно?",
            "Письмо себе: — «Я горжусь…» — «Я стараюсь…» — «Я прощаю себе…»",
            "Обновить планы / решить: «Завтра начну с простого»",
        ]
    }
];

const ALT_LINE = "💡 Или просто выбери 1 простую вещь из списка — даже это уже шаг!";

// --- Инициализация базы ---
const db = new Low(new JSONFile('db.json'), { users: {} });

async function initDB() {
    await db.read();
    await db.write();
}

// --- Главное меню (ReplyKeyboard) ---
const mainMenu = Markup.keyboard([
    ['📋 Чек-лист', '📈 Прогресс'],
    ['💡 Мотивация', 'ℹ️ Помощь'],
    ['🔥 Серия', '♻️ Сбросить']
]).resize();

// --- Вспомогательные функции ---
function getTodayKey() {
    return dayjs().format('YYYY-MM-DD');
}

function getWeekKey() {
    return dayjs().format('YYYY-[W]WW');
}

function getWeekdayIndex() {
    // 0 - воскресенье, 1 - понедельник, ... 6 - суббота
    let idx = dayjs().day();
    return idx === 0 ? 6 : idx - 1;
}

function getChecklistText(idx) {
    const day = WEEKLY_CHECKLIST[idx];
    let text = `✅ ${day.title}\n`;
    day.tasks.forEach((t, i) => text += `• ${t}\n`);
    text += ALT_LINE;
    return text;
}

function getChecklistButtons(userId, idx) {
    const todayKey = getTodayKey();
    const user = db.data.users[userId] ||= {};
    user[todayKey] ||= { done: Array(WEEKLY_CHECKLIST[idx].tasks.length).fill(false) };
    return Markup.inlineKeyboard(
        WEEKLY_CHECKLIST[idx].tasks.map((t, i) => [
            Markup.button.callback(
                (user[todayKey].done[i] ? '✅' : '⬜') + ' ' + (i + 1),
                `done_${i}`
            ),
            Markup.button.callback('🔁 Пропустить', `skip_${i}`)
        ])
    );
}

function getProgressText(userId) {
    const user = db.data.users[userId] || {};
    let week = {};
    Object.keys(user).forEach(date => {
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const w = dayjs(date).format('YYYY-[W]WW');
            week[w] ||= [];
            week[w].push(user[date]);
        }
    });
    const thisWeek = week[getWeekKey()] || [];
    let daysDone = 0,
        daysPartial = 0,
        totalTasks = 0,
        totalDone = 0;
    thisWeek.forEach(day => {
        const done = day.done.filter(Boolean).length;
        totalTasks += day.done.length;
        totalDone += done;
        if (done === day.done.length) daysDone++;
        else if (done > 0) daysPartial++;
    });
    let percent = totalTasks ? Math.round(totalDone / totalTasks * 100) : 0;
    return `📊 Прогресс за неделю:\nДней полностью: ${daysDone}\nДней частично: ${daysPartial}\nВыполнено задач: ${totalDone} из ${totalTasks} (${percent}%)`;
}

// --- Серия дней ---
function updateStreak(userId) {
    const user = db.data.users[userId] ||= {};
    let streak = user._streak || { count: 0, last: null };
    const today = getTodayKey();
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const idxToday = getWeekdayIndex();
    const idxYesterday = dayjs().subtract(1, 'day').day() === 0 ? 6 : dayjs().subtract(1, 'day').day() - 1;

    // Проверяем выполнение за сегодня и вчера
    const todayDone = user[today]?.done || [];
    const yesterdayDone = user[yesterday]?.done || [];

    const todayPercent = todayDone.length ? todayDone.filter(Boolean).length / todayDone.length : 0;
    const yesterdayPercent = yesterdayDone.length ? yesterdayDone.filter(Boolean).length / yesterdayDone.length : 0;

    if (todayPercent >= 0.8 && yesterdayPercent >= 0.8) {
        // Продолжаем или начинаем серию
        if (streak.last === yesterday) {
            streak.count += 1;
        } else {
            streak.count = 2; // новая серия
        }
        streak.last = today;
    } else if (todayPercent >= 0.8) {
        // Только сегодня выполнено, но вчера нет — серия сброшена
        streak.count = 1;
        streak.last = today;
    } else {
        streak.count = 0;
        streak.last = null;
    }
    user._streak = streak;
    return streak;
}

function getStreakText(userId) {
    const user = db.data.users[userId] ||= {};
    const streak = user._streak || { count: 0 };
    if (streak.count >= 2) {
        return `🔥 Ваша серия: ${streak.count} дней подряд с выполнением >80% чек-листа!`;
    }
    return '';
}

// --- Инициализация бота ---
const bot = new Telegraf(BOT_TOKEN);

// --- Команды ---
bot.start(async ctx => {
    await initDB();
    await sendTodayChecklist(ctx, true);
});

bot.command('help', async ctx => {
    await ctx.replyWithHTML(
`ℹ️ <b>Помощь по боту</b>

Этот бот — ваш персональный еженедельный чек-лист для саморазвития.

<b>Доступные действия:</b>
📋 Чек-лист — задачи на сегодня  
📈 Прогресс — статистика за неделю  
💡 Мотивация — случайная цитата  
🔥 Серия — узнать длину вашей серии дней  
♻️ Сбросить — сбросить прогресс  
ℹ️ Помощь — это сообщение

<b>Серия дней 🔥</b>
Если вы выполняете чек-лист на 80% и больше два дня подряд — начинается серия. Каждый следующий день с выполнением 80% и больше увеличивает серию. Если день пропущен или выполнено меньше 80% — серия сбрасывается.

<b>Как пользоваться:</b>
• Каждый день в 8:00 вы получаете чек-лист.
• Отмечайте задачи кнопками <b>✅</b> (выполнено) или <b>🔁</b> (пропустить).
• Бот считает процент выполнения и ведёт статистику по неделям.
• Каждый час — напоминания, а в воскресенье — мотивационный отчёт.

<b>Мотивация:</b>
💡 Даже один выполненный пункт — уже шаг к развитию!

Удачи!`,
        mainMenu
    );
});

// --- Обработка ReplyKeyboard (главное меню) ---
bot.hears('📋 Чек-лист', async ctx => {
    await sendTodayChecklist(ctx, false);
});
bot.hears('📈 Прогресс', async ctx => {
    const text = getProgressText(ctx.from.id);
    await ctx.reply(text, mainMenu);
});
bot.hears('💡 Мотивация', async ctx => {
    const quote = getRandomQuote();
    await ctx.reply(`💡 Мотивация:\n${quote}`, mainMenu);
});
bot.hears('ℹ️ Помощь', async ctx => {
    await ctx.replyWithHTML(
`ℹ️ <b>Помощь по боту</b>

Этот бот — ваш персональный еженедельный чек-лист для саморазвития.

<b>Доступные действия:</b>
📋 Чек-лист — задачи на сегодня  
📈 Прогресс — статистика за неделю  
💡 Мотивация — случайная цитата  
🔥 Серия — узнать длину вашей серии дней  
♻️ Сбросить — сбросить прогресс  
ℹ️ Помощь — это сообщение

<b>Серия дней 🔥</b>
Если вы выполняете чек-лист на 80% и больше два дня подряд — начинается серия. Каждый следующий день с выполнением 80% и больше увеличивает серию. Если день пропущен или выполнено меньше 80% — серия сбрасывается.

<b>Как пользоваться:</b>
• Каждый день в 8:00 вы получаете чек-лист.
• Отмечайте задачи кнопками <b>✅</b> (выполнено) или <b>🔁</b> (пропустить).
• Бот считает процент выполнения и ведёт статистику по неделям.
• Каждый час — напоминания, а в воскресенье — мотивационный отчёт.

<b>Мотивация:</b>
💡 Даже один выполненный пункт — уже шаг к развитию!

Удачи!`,
        mainMenu
    );
});
bot.hears('🔥 Серия', async ctx => {
    const streakText = getStreakText(ctx.from.id);
    if (streakText) {
        await ctx.reply(streakText, mainMenu);
    } else {
        await ctx.reply('Серия ещё не началась. Выполняйте чек-лист два дня подряд на 80% и больше!', mainMenu);
    }
});
bot.hears('♻️ Сбросить', async ctx => {
    await ctx.reply(
        'Вы точно хотите удалить весь прогресс?',
        Markup.inlineKeyboard([
            [Markup.button.callback('✅ Да', 'reset_yes'), Markup.button.callback('❌ Нет', 'reset_no')]
        ])
    );
});

// --- Инлайн кнопки подтверждения сброса ---
bot.action('reset_yes', async ctx => {
    db.data.users[ctx.from.id] = {};
    await db.write();
    await ctx.editMessageText('Прогресс удалён! 👍');
    await ctx.reply('Выберите действие:', mainMenu);
    await ctx.answerCbQuery();
});
bot.action('reset_no', async ctx => {
    await ctx.editMessageText('Отмена удаления прогресса.');
    await ctx.reply('Выберите действие:', mainMenu);
    await ctx.answerCbQuery();
});

// --- Инлайн кнопки чек-листа ---
bot.on('callback_query', async ctx => {
    if (!ctx.callbackQuery.data.startsWith('done_') && !ctx.callbackQuery.data.startsWith('skip_')) return;
    await initDB();
    const userId = ctx.from.id;
    const todayKey = getTodayKey();
    const idx = getWeekdayIndex();
    const user = db.data.users[userId] ||= {};
    user[todayKey] ||= { done: Array(WEEKLY_CHECKLIST[idx].tasks.length).fill(false) };

    const data = ctx.callbackQuery.data;
    if (data.startsWith('done_')) {
        const num = parseInt(data.split('_')[1]);
        user[todayKey].done[num] = true;
        await db.write();
        updateStreak(userId);
        await ctx.answerCbQuery('Отмечено!');
        try {
            await ctx.editMessageReplyMarkup(getChecklistButtons(userId, idx).reply_markup);
        } catch (e) {
            if (!e.message.includes('message is not modified')) throw e;
        }
        await ctx.reply(getChecklistStatus(userId, idx));
    } else if (data.startsWith('skip_')) {
        await ctx.answerCbQuery('Пропущено!');
        try {
            await ctx.editMessageReplyMarkup(getChecklistButtons(userId, idx).reply_markup);
        } catch (e) {
            if (!e.message.includes('message is not modified')) throw e;
        }
    }
});

// --- Статус чеклиста ---
function getChecklistStatus(userId, idx) {
    const todayKey = getTodayKey();
    const user = db.data.users[userId] ||= {};
    user[todayKey] ||= { done: Array(WEEKLY_CHECKLIST[idx].tasks.length).fill(false) };
    const done = user[todayKey].done.filter(Boolean).length;
    const total = WEEKLY_CHECKLIST[idx].tasks.length;
    const percent = Math.round(done / total * 100);
    return `Выполнено: ${done} из ${total} (${percent}%)`;
}

// --- Отправка чеклиста ---
async function sendTodayChecklist(ctx, showMenu = true) {
    const idx = getWeekdayIndex();
    const text = getChecklistText(idx);
    await ctx.reply(text, getChecklistButtons(ctx.from.id, idx));
    await ctx.reply(getChecklistStatus(ctx.from.id, idx));
    if (showMenu) await ctx.reply('Выберите действие:', mainMenu);
}

// --- Ежедневная рассылка чеклиста ---
schedule.scheduleJob('0 8 * * *', async () => {
    await initDB();
    const users = Object.keys(db.data.users);
    for (const userId of users) {
        const idx = getWeekdayIndex();
        const text = getChecklistText(idx);
        await bot.telegram.sendMessage(userId, text, getChecklistButtons(userId, idx));
        await bot.telegram.sendMessage(userId, getChecklistStatus(userId, idx));
        await bot.telegram.sendMessage(userId, 'Выберите действие:', mainMenu);
    }
});

// --- Почасовые напоминания ---
schedule.scheduleJob('0 9-23,0-1 * * *', async () => {
    await initDB();
    const users = Object.keys(db.data.users);
    const reminders = [
        "🕐 Уже час прошёл! Сделай хотя бы 1 шаг из чеклиста!",
        "🔔 Маленький шаг — тоже движение. Выполни хотя бы одно задание.",
        "⏳ Не забывай про свой чеклист — даже 1 пункт важен!",
        "💪 Ты можешь больше, чем думаешь. Сделай шаг сейчас!"
    ];
    for (const userId of users) {
        await bot.telegram.sendMessage(userId, reminders[Math.floor(Math.random() * reminders.length)]);
    }
});

// --- Утренняя мотивация и серия ---
schedule.scheduleJob('0 9 * * *', async () => {
    await initDB();
    const users = Object.keys(db.data.users);
    for (const userId of users) {
        updateStreak(userId);
        const streakText = getStreakText(userId);
        const quote = getRandomQuote();
        let msg = `Доброе утро!\n💡 Мотивация: ${quote}`;
        if (streakText) msg += `\n\n${streakText}`;
        await bot.telegram.sendMessage(userId, msg);
    }
});

// --- Еженедельный отчёт ---
schedule.scheduleJob('0 22 * * 0', async () => {
    await initDB();
    const users = Object.keys(db.data.users);
    for (const userId of users) {
        const text = getProgressText(userId);
        const quote = MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)];
        await bot.telegram.sendMessage(userId, `🌟 Итоги недели:\n${text}\n\n💡 Мотивация: ${quote}`);
    }
});

bot.launch();
console.log('Бот запущен!');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

let lastQuoteIndex = -1;

function getRandomQuote() {
    let idx;
    do {
        idx = Math.floor(Math.random() * MOTIVATION_QUOTES.length);
    } while (idx === lastQuoteIndex && MOTIVATION_QUOTES.length > 1);
    lastQuoteIndex = idx;
    return MOTIVATION_QUOTES[idx];
}