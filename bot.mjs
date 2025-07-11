import { Telegraf, Markup } from 'telegraf';
import schedule from 'node-schedule';
import dayjs from 'dayjs';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

// --- Настройка lowdb ---
const adapter = new JSONFile('db.json');
const db = new Low(adapter, { users: {} });

async function initDB() {
    await db.read();
    if (!db.data) db.data = { users: {} };
    await db.write();
}

// --- Ваш токен ---
const BOT_TOKEN = "7804238972:AAFfnqmnuRKYFM3CzvJ-Es9j1ucQWCej3Uw";

// --- Мотивационные цитаты ---
const MOTIVATION_QUOTES = [
    "Делай сегодня то, что другие не хотят — завтра будешь жить так, как другие не могут. — Джерри Райс",
    "Просыпайся с мыслью, что нужно изменить чью-то жизнь. Хотя бы свою. — Рой Беннет",
    "Если не сейчас, то когда? — Эмма Гольдман",
    "Не жди вдохновения — приди и возьми его. — Чак Паланик",
    "Сделай шаг, и дорога появится сама. — Джон Локк",
    "Успех — это 10% удачи и 90% потения. — Томас Эдисон",
    "Ты не сможешь изменить свою жизнь, пока не изменишь то, что делаешь каждый день. — Джон Максвелл",
    "Лучший способ начать — перестать говорить и начать делать. — Уолт Дисней",
    "Если тебе тяжело — значит, ты растешь. — Джим Рон",
    "Мечты не работают, пока не работаешь ты. — Стивен Кови",
    "Каждый день — это чистый лист. Что ты на нем напишешь? — Брюс Ли",
    "Мотивация заканчивается — привычка остается. — Зиг Зиглар",
    "Не откладывай свою жизнь на потом. «Потом» — это ловушка. — Леонардо да Винчи",
    "Если не веришь в себя, найди того, кто верит, и докажи ему правоту. — Генри Форд",
    "Работай молча. Пусть успех будет твоим шумом. — Фрэнк Оушен",
    "Сложное становится простым, когда ты начинаешь действовать. — Конфуций",
    "Ты либо находишь путь, либо создаешь его. — Наполеон Бонапарт",
    "Не бойся делать то, что не умеешь. Ковчег построил любитель, «Титаник» — профессионалы. — Дэйв Бервис",
    "Дисциплина — это мост между целями и достижениями. — Джим Рон",
    "Скорость не важна — важно движение. — Далай-лама",
    "Не жди идеальных условий — создавай их. — Джордж Бернард Шоу",
    "Если ты не готов рискнуть обычным, придется довольствоваться заурядным. — Джим Рон",
    "«Завтра» — самое опасное слово в словаре успеха. — Грант Кардон",
    "Не говори «у меня нет времени». У тебя ровно столько же часов в сутках, сколько у Бейонсе. — Кэтрин Хепберн",
    "Трудное — временно, результат — вечен. — Альберт Эйнштейн",
    "Если ты не управляешь своим днем, им управляет кто-то другой. — Джим Кэткарт",
    "Сделай хотя бы что-то сегодня — твое будущее «я» скажет тебе спасибо. — Неизвестный",
    "Боль сгорает в огне действия. — Дэн Кеннеди",
    "Ты не проиграл, пока не отказался от попыток. — Майкл Джордан",
    "Не ищи часы — создавай их. — Пабло Пикассо",
    "Действие — это фундаментальная сила успеха. — Тони Роббинс",
    "Лень — это привычка отдыхать до того, как устанешь. — Жюль Ренар",
    "Страх исчезает, когда начинается действие. — Уильям Джеймс",
    "Не жди, пока закончится шторм — учись танцевать под дождем. — Вивиан Грин",
    "Ты можешь ждать годами «подходящего момента» или создать его за 5 минут. — Гэри Вайнерчук",
    "Никто не поднимется на вершину, таская за собой камни оправданий. — Брюс Ли",
    "Если тебе не нравится дорога, по которой идешь, начни прокладывать другую. — Долли Партон",
    "Продуктивность — это не случайность. Это выбор. — Стивен Кови",
    "Секрет успеха — начать, пока другие откладывают. — Марк Твен",
    "Ты не обязан быть великим, чтобы начать, но должен начать, чтобы стать великим. — Зиг Зиглар",
    "Не смотри на часы — делай то, что они делают: иди вперед. — Сэм Левенсон",
    "Работай, пока другие спят. Учись, пока другие развлекаются. Готовься, пока другие играют. Мечтай, пока другие желают. — Уильям Артур Уорд",
    "Если ты не готов измениться — не жди изменений. — Джим Рон",
    "Сделай первый шаг — ты не увидишь всю лестницу, просто начни. — Мартин Лютер Кинг",
    "Будущее создается сегодня, а не завтра. — Пауло Коэльо",
    "Не жди мотивации — создавай ее. — Грант Кардон",
    "Ты не поднимаешься до уровня своих целей — падаешь до уровня своих действий. — Джеймс Клир",
    "Каждый раз, когда ты говоришь «потом», твои мечты уменьшаются. — Неизвестный",
    "Действие — это лекарство от страха. — Дэвид Дж. Шварц",
    "Если не ты, то кто? Если не сейчас, то когда? — Хиллель Старший",
    "Твой мозг — инструмент. Научись им пользоваться, или он будет использовать тебя. — Джим Квик",
    "Самый долгий путь начинается с одного шага. Сделай его. — Лао-Цзы",
    // Рокки
    "Мир не будет сиять тебе в лицо только потому, что ты добрый парень. Умей бить! (Рокки Бальбоа, «Рокки»)",
    "Не важно, как сильно ты ударишь. Важно, как сильно тебя ударят — и ты сможешь продолжать идти. («Рокки»)",
    "Если ты знаешь, чего стоишь, иди и возьми это! Но будь готов получать удары. («Рокки»)",
    // Бойцовский клуб
    "Ты — не твоя работа. Не твои деньги на счету. Не твоя машина. Ты — не твоё дерьмовое хаки. (Тайлер Дёрден, «Бойцовский клуб»)",
    "По-настоящему свободен лишь тот, кто потерял всё. («Бойцовский клуб»)",
    "Без жертв и боли ты не станешь тем, кем хочешь быть. («Бойцовский клуб»)",
    // Волк с Уолл-стрит
    "Единственная вещь, стоящая между тобой и твоей целью — это та херня, которую ты сам себе рассказываешь. (Джордан Белфорт, «Волк с Уолл-стрит»)",
    "Будь голодным. Оставайся голодным. («Волк с Уолл-стрит»)",
    // Гладиатор
    "Что мы делаем в жизни? Эхо наших поступков звучит в вечности! (Максимус, «Гладиатор»)",
    "Смерть улыбается всем. Люди могут лишь улыбнуться ей в ответ. («Гладиатор»)",
    // Начало
    "Ты должен поверить, что тебя ждёт успех. Ты уже на краю, но единственный способ проиграть — перестать пытаться. (Кобб, «Начало»)",
    // Форрест Гамп
    "Жизнь — как коробка конфет. Никогда не знаешь, что тебе попадётся. (Форрест Гамп, «Форрест Гамп»)",
    "Беги, Форрест, беги! («Форрест Гамп»)",
    // Тёмный рыцарь
    "Зачем мы падаем? Чтобы научиться подниматься. (Альфред, «Тёмный рыцарь»)",
    "Ты либо умираешь героем, либо живёшь так долго, что становишься злодеем. (Харви Дент, «Тёмный рыцарь»)",
    // Общество мёртвых поэтов
    "Carpe diem! Лови момент, мальчики! Делайте свою жизнь необыкновенной! (Джон Китинг, «Общество мёртвых поэтов»)",
    // Крёстный отец
    "Держи друзей близко, а врагов ещё ближе. (Майкл Корлеоне, «Крёстный отец»)",
    "Большая власть приходит с большой ответственностью. («Крёстный отец»)",
    // Бегущий по лезвию
    "Я видел такое, во что вы, люди, не поверите… (Рой Батти, «Бегущий по лезвию»)",
    "Время умирать. (Рой Батти, «Бегущий по лезвию»)"
];

// Мотивирующие цитаты для работы над собой и своей жизнью
MOTIVATION_QUOTES.push(
    "Победа — это не случайность. Это ежедневный труд, дисциплина и любовь к тому, что ты делаешь. — Пеле",
    "Ты не становишься лучше в один день — ты становишься лучше каждый день. — Джордан Белфорт",
    "Если ты не готов работать над собой, зачем ждать, что жизнь изменится? — Джим Рон",
    "Самый сложный соперник — не другие, а ты вчерашний. — Брюс Ли",
    "Если тебе легко — значит, ты не растешь. — Арнольд Шварценеггер",
    "Боль — это временно. Гордость за себя — навсегда.",
    "Ты — автор своей жизни. Не жди, пока кто-то напишет за тебя. — Джордж Бернард Шоу",
    "Не ищи виноватых. Ищи решения. — Генри Форд",
    "Жизнь — это 10% того, что с тобой происходит, и 90% того, как ты на это реагируешь. — Чарльз Свиндолл",
    "Если тебе не нравится твоя жизнь — измени её. Ты не дерево. — Джим Рон",
    "Страх — это индикатор. Если боишься — значит, это важно. — Тони Роббинс",
    "Лучшее время посадить дерево было 20 лет назад. Следующий лучший момент — сейчас. — Китайская пословица",
    "Ты не можешь вырастить дерево за день, но можешь посадить семя сегодня. — Джеймс Клир",
    "Успех — это сумма небольших усилий, повторяемых изо дня в день. — Роберт Колльер",
    "Инвестируй в себя. Это единственное вложение, которое точно окупится. — Уоррен Баффет",
    "Если не ты, то кто? Если не сейчас, то когда? — Хиллель Старший",
    "Мечты не работают, пока не работаешь ты. — Стивен Кови",
    "Не жди идеального момента. Возьми этот момент и сделай его идеальным.",
    "Мы — это то, что мы делаем постоянно. — Аристотель",
    "Сначала ты формируешь привычки, потом привычки формируют тебя. — Джон Драйден",
    "Маленькие ежедневные улучшения приводят к огромным результатам. — Робин Шарма",
    "Страх убивает мечты быстрее, чем неудачи. — Эрик Томас",
    "Делай то, что боишься делать, и страх умрет. — Ральф Уолдо Эмерсон",
    "Если не попробуешь — уже проиграл.",
    "Ты сильнее, чем думаешь. Достаточно просто начать.",
    "Никто не придет спасать тебя. Ты сам себе герой.",
    "Сила не в том, чтобы никогда не падать, а в том, чтобы подниматься каждый раз.",
    "Не ищи смысл жизни — создавай его. — Жан-Поль Сартр",
    "Живи так, чтобы твоя биография стоила того, чтобы её прочитать. — Джим Рон",
    "Ты рожден не для того, чтобы быть серым, обычным, незаметным. Ты рожден, чтобы сиять."
);

// --- Чеклисты по дням недели ---
const WEEKLY_CHECKLIST = [
    {
        title: "ПОНЕДЕЛЬНИК — Психология влияния (~85–95 мин)",
        tasks: [
            "Смотреть видео/лекцию о манипуляциях (30 мин)",
            "Подумать: где я с этим сталкивался? (10 мин)",
            "Записать: в чём я умею влиять? (10 мин)",
            "Медитация или дыхание (по желанию, 5 мин)",
            "Читать книгу (20 мин)",
            "Изучить английский (10–20 мин)"
        ]
    },
    {
        title: "ВТОРНИК — Финансовое мышление (~85–95 мин)",
        tasks: [
            "Смотреть видео / читать статью про мышление богатства (30 мин)",
            "Ответить письменно: как бы я потратил 10.000₽? (15 мин)",
            "Подумать: что я делаю правильно с деньгами? (5 мин)",
            "Чек-ин: как я себя чувствую сейчас? (5 мин)",
            "Читать книгу (20 мин)",
            "Изучить английский (10–20 мин)"
        ]
    },
    {
        title: "СРЕДА — Уверенность и речь (~72–82 мин)",
        tasks: [
            "Смотреть TED / выступление с харизмой (20 мин)",
            "Записать себя: как прошли 3 дня (2 мин)",
            "Проанализировать: что звучало уверенно? (10 мин)",
            "Выучить 5 сильных слов (5 мин)",
            "Проговорить: «Что я думаю о себе» (5 мин)",
            "Читать книгу (20 мин)",
            "Изучить английский (10–20 мин)"
        ]
    },
    {
        title: "ЧЕТВЕРГ — Кодинг / логика (~90–100 мин)",
        tasks: [
            "Пройти мини-урок по Python / визуальному кодингу (30 мин)",
            "Записать, что понял (10 мин)",
            "Подумать: что бы хотел создать? (10 мин)",
            "Прогулка или чай (отдых, 10 мин)",
            "Читать книгу (20 мин)",
            "Изучить английский (10–20 мин)"
        ]
    },
    {
        title: "ПЯТНИЦА — Спокойствие и самоанализ (~80–90 мин)",
        tasks: [
            "Медитация под эмбиент / тихая музыка (10 мин)",
            "Написать: — что почувствовал? — где был честен с собой? — где осудил себя — и зачем? (10 мин)",
            "Прогулка или отдых в тишине (15 мин)",
            "Музыка, которая лечит (15 мин)",
            "Читать книгу (20 мин)",
            "Изучить английский (10–20 мин)"
        ]
    },
    {
        title: "СУББОТА — Эстетика и вкус (~75–85 мин)",
        tasks: [
            "Смотреть красивое видео / монтаж / дизайн (15 мин)",
            "Подумать: что именно понравилось? (10 мин)",
            "Сохранить 3 идеи (5 мин)",
            "Придумать 1 идею для TikTok/канала (5 мин)",
            "Писать как хочется (10 мин)",
            "Читать книгу (20 мин)",
            "Изучить английский (10–20 мин)"
        ]
    },
    {
        title: "ВОСКРЕСЕНЬЕ — Рефлексия и перезагрузка (~60–70 мин)",
        tasks: [
            "Написать: — что я понял о себе за неделю? — что получилось, что было трудно? (10 мин)",
            "Письмо себе: — «Я горжусь…» — «Я стараюсь…» — «Я прощаю себе…» (10 мин)",
            "Обновить планы / решить: «Завтра начну с простого» (10 мин)",
            "Читать книгу (20 мин)",
            "Изучить английский (10–20 мин)"
        ]
    }
];

const ALT_LINE = "💡 Или просто выбери 1 простую вещь из списка — даже это уже шаг!";

// --- Привычки дня ---
const HABITS = [
    // Для ума и саморазвития
    "Читать 10 страниц книги",
    "Послушать подкаст на интересную тему",
    "Записать 3 благодарности",
    "Вести дневник мыслей вечером",
    "Планировать день с утра",
    "Выучить новое слово (на любом языке)",
    "Писать список задач на день",
    "Писать 1 инсайт дня",
    "Писать 1 вопрос самому себе",
    "Писать 1 маленькую победу дня",
    "Писать 1 идею для будущего",
    "Писать, что получилось за день",
    "Писать, что сделал хорошо",
    "Писать, чему научился сегодня",
    "Писать, что вызвало радость",

    // Для тела и здоровья
    "Утренняя зарядка (5–10 мин)",
    "Растяжка после сна",
    "Прогулка 30 минут",
    "Пить 1 стакан воды после пробуждения",
    "Спать не менее 7 часов",
    "Ограничить сахар на день",
    "Не есть за 2 часа до сна",
    "Контрастный душ утром",
    "Разминка перед работой за компьютером",
    "Есть овощи в каждом приёме пищи",
    "Делать короткую тренировку дома",
    "Танцевать под любимую песню",
    "Использовать лестницу вместо лифта",
    "Делать перерывы на движение каждый час",
    "Пить воду вместо сладких напитков",
    "Следить за осанкой",

    // Для продуктивности и порядка
    "Убирать рабочее место в конце дня",
    "Делать 3 важные задачи до обеда",
    "Проверять, не отвлекаешься ли",
    "Составлять список 'не делать'",
    "Планировать 1 день в неделю вперёд",
    "Делегировать 1 мелкую задачу",
    "Заканчивать начатое",
    "Устанавливать дедлайн даже для мелочей",
    "Записывать идеи в одном месте",
    "Проверять почту только в определённое время",

    // Для общения и уверенности
    "Говорить 'спасибо' осознанно",
    "Слушать без перебиваний",
    "Делать 1 комплимент в день",
    "Спрашивать 'как ты?' и слушать ответ",
    "Поддерживать зрительный контакт",
    "Не жаловаться весь день",
    "Писать/звонить другу 1 раз в неделю",
    "Отвечать не сразу, а после паузы",
    "Улыбаться при общении",
    "Хвалить себя вслух",

    // Для психики и спокойствия
    "Сканировать тело на напряжение",
    "Вести дневник эмоций",
    "Дышать 4–7–8 (вдох–удержание–выдох)",
    "Делать 'паузу осознанности'",
    "Слушать расслабляющую музыку",
    "Писать, что тебя злит (вместо срыва)",
    "Сортировать эмоции по ощущениям",
    "Ходить босиком дома",
    "Медитировать 5 минут",

    // Для цифровой гигиены
    "Не брать телефон первым делом с утра",
    "Отключить ненужные уведомления",
    "Делать цифровой детокс вечером",
    "Убрать соцсети с главного экрана",
    "Установить лимит на экранное время",
    "Чистить галерею от мусора",
    "Удалять ненужные приложения",
    "Перенести фото в облако",
    "Не скроллить перед сном",

    // Для творчества
    "Делать 1 фото в день",
    "Вести идеи для творчества",
    "Рисовать 5 минут от руки",
    "Писать стихи или строчки",
    "Играть на инструменте",
    "Петь вслух",
    "Танцевать под музыку",
    "Составлять коллаж настроения",
    "Смотреть вдохновляющее видео",
    "Делать свой маленький проект",

    // Для быта и минимализма
    "Убирать 5 вещей в день",
    "Раз в неделю выбрасывать ненужное",
    "Мыть посуду сразу",
    "Готовить еду заранее",
    "Делать ревизию одежды",
    "Проветривать комнату",
    "Протирать пыль ежедневно",
    "Ставить вещи на свои места",
    "Провести 10 минут без телефона",
    "Сделать доброе дело незаметно"
];

// --- Главное меню (ReplyKeyboard) ---
const mainMenu = Markup.keyboard([
    ['📋 Чек-лист', '📈 Прогресс'],
    ['📅 История', '💡 Мотивация'],
    ['🔥 Серия', '🏅 Достижения'],
    ['💡 Привычка дня', '📝 Заметки'],
    ['♻️ Сбросить', '/help'] // ← здесь вместо 'ℹ️ Помощь' пишем '/help'
]).resize();

// --- Вспомогательные функции ---
function getTodayKey() {
    return dayjs().format('YYYY-MM-DD');
}
function getWeekKey() {
    return dayjs().format('YYYY-[W]WW');
}
function getMonthKey() {
    return dayjs().format('YYYY-MM');
}
function getWeekdayIndex() {
    let idx = dayjs().day();
    return idx === 0 ? 6 : idx - 1;
}
function getChecklistText(idx) {
    const day = WEEKLY_CHECKLIST[idx];
    let text = `✅ ${day.title}\n`;
    day.tasks.forEach((t, i) => text += `${i + 1}. ${t}\n`);
    text += ALT_LINE;
    return text;
}
function getChecklistButtons(userId, idx) {
    const todayKey = getTodayKey();
    const user = db.data.users[userId] ||= { progress: {}, streak: 0, medals: [], habitsSent: [] };
    user.progress[todayKey] ||= Array(WEEKLY_CHECKLIST[idx].tasks.length).fill(false);
    return Markup.inlineKeyboard(
        WEEKLY_CHECKLIST[idx].tasks.map((t, i) => [
            Markup.button.callback(
                (user.progress[todayKey][i] ? '✅' : '⬜') + ' ' + (i + 1),
                `done_${i}`
            ),
            Markup.button.callback('🔁 Пропустить', `skip_${i}`)
        ])
    );
}
function getChecklistStatus(userId, idx) {
    const todayKey = getTodayKey();
    const user = db.data.users[userId] ||= { progress: {}, streak: 0, medals: [], habitsSent: [] };
    user.progress[todayKey] ||= Array(WEEKLY_CHECKLIST[idx].tasks.length).fill(false);
    const done = user.progress[todayKey].filter(Boolean).length;
    const total = WEEKLY_CHECKLIST[idx].tasks.length;
    const percent = Math.round(done / total * 100);
    return `Выполнено: ${done} из ${total} (${percent}%)`;
}
function getProgressText(userId) {
    const user = db.data.users[userId] || { progress: {}, streak: 0, medals: [] };
    let week = {};
    Object.keys(user.progress).forEach(date => {
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const w = dayjs(date).format('YYYY-[W]WW');
            week[w] ||= [];
            week[w].push(user.progress[date]);
        }
    });
    const thisWeek = week[getWeekKey()] || [];
    let daysDone = 0, daysPartial = 0, totalTasks = 0, totalDone = 0;
    thisWeek.forEach(day => {
        const done = day.filter(Boolean).length;
        totalTasks += day.length;
        totalDone += done;
        if (done === day.length) daysDone++;
        else if (done > 0) daysPartial++;
    });
    let percent = totalTasks ? Math.round(totalDone / totalTasks * 100) : 0;
    return `📊 Прогресс за неделю:\nДней полностью: ${daysDone}\nДней частично: ${daysPartial}\nВыполнено задач: ${totalDone} из ${totalTasks} (${percent}%)`;
}
function calculateStreak(userId) {
    const user = db.data.users[userId] || { progress: {}, streak: 0, medals: [] };
    const dates = Object.keys(user.progress)
        .filter(date => date.match(/^\d{4}-\d{2}-\d{2}$/))
        .sort((a, b) => dayjs(b).diff(dayjs(a)));
    let streak = 0;
    let prev = null;
    for (const date of dates) {
        const done = user.progress[date];
        const total = done.length;
        const completed = done.filter(Boolean).length;
        if (total === 0 || completed / total < 0.8) break;
        if (prev && dayjs(prev).diff(dayjs(date), 'day') !== 1) break;
        streak++;
        prev = date;
    }
    return streak;
}
function getMonthProgress(userId) {
    const user = db.data.users[userId] || { progress: {}, streak: 0, medals: [] };
    const monthKey = getMonthKey();
    let days = 0, full = 0, partial = 0;
    Object.keys(user.progress).forEach(date => {
        if (date.startsWith(monthKey)) {
            days++;
            const arr = user.progress[date];
            const done = arr.filter(Boolean).length;
            if (done === arr.length) full++;
            else if (done > 0) partial++;
        }
    });
    return `📅 За месяц: дней с прогрессом — ${days}, полностью выполнено — ${full}, частично — ${partial}`;
}

// --- Мотивация ---
let quotesQueue = [];
function shuffleQuotes() {
    quotesQueue = MOTIVATION_QUOTES
        .map(q => ({ q, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ q }) => q);
}
function getNextQuote() {
    if (quotesQueue.length === 0) shuffleQuotes();
    return quotesQueue.pop();
}

// --- Достижения ---
function checkMedals(userId) {
    const user = db.data.users[userId];
    user.medals ||= [];
    if (user.streak >= 7 && !user.medals.includes('7days')) {
        user.medals.push('7days');
    }
    if (user.streak >= 30 && !user.medals.includes('30days')) {
        user.medals.push('30days');
    }
    const anyDone = Object.values(user.progress).some(arr => arr.some(Boolean));
    if (anyDone && !user.medals.includes('firsttask')) {
        user.medals.push('firsttask');
    }
}

// --- Добавим поле notes и mood в структуру пользователя ---
const getDefaultUser = () => ({
    progress: {},
    streak: 0,
    medals: [],
    habitsSent: [],
    notes: [],
    mood: {}
});

// --- Инициализация бота ---
const bot = new Telegraf(BOT_TOKEN);

// --- Команды и обработчики ---
bot.start(async ctx => {
    await initDB();
    await sendTodayChecklist(ctx, true);
});
bot.hears('📋 Чек-лист', async ctx => {
    await initDB();
    await sendTodayChecklist(ctx, false);
});
bot.hears('📈 Прогресс', async ctx => {
    await initDB();
    const text = getProgressText(ctx.from.id);
    await ctx.reply(text, mainMenu);
});
bot.hears('📅 История', async ctx => {
    await initDB();
    const text = getMonthProgress(ctx.from.id);
    await ctx.reply(text, mainMenu);
});
bot.hears('💡 Мотивация', async ctx => {
    const quote = getNextQuote();
    await ctx.reply(`💡 Мотивация:\n${quote}`, mainMenu);
});
bot.hears('🔥 Серия', async ctx => {
    await initDB();
    const user = db.data.users[ctx.from.id] || { progress: {}, streak: 0, medals: [] };
    const streak = user.streak || 0;
    if (streak > 1) {
        await ctx.reply(`🔥 Ваша серия: ${streak} дней подряд с выполнением чек-листа на 80% и более!`, mainMenu);
    } else if (streak === 1) {
        await ctx.reply('🔥 Серия только началась! Продолжайте выполнять чек-лист на 80% и более каждый день.', mainMenu);
    } else {
        await ctx.reply('Серия ещё не началась. Выполняйте чек-лист два дня подряд на 80% и больше!', mainMenu);
    }
});
bot.hears('🏅 Достижения', async ctx => {
    await initDB();
    const user = db.data.users[ctx.from.id] || { progress: {}, streak: 0, medals: [] };
    let text = '🏅 Ваши достижения:\n';
    if (user.medals?.length) {
        if (user.medals.includes('firsttask')) text += '• Первая выполненная задача\n';
        if (user.medals.includes('7days')) text += '• Серия 7 дней подряд\n';
        if (user.medals.includes('30days')) text += '• Серия 30 дней подряд\n';
    } else {
        text += 'Пока нет достижений. Всё впереди!';
    }
    await ctx.reply(text, mainMenu);
});
bot.hears('💡 Привычка дня', async ctx => {
    await initDB();
    const habit = HABITS[Math.floor(Math.random() * HABITS.length)];
    await ctx.reply(`💡 Привычка дня:\n${habit}`, mainMenu);
});
bot.hears('📝 Заметки', ctx => ctx.reply('Добавьте заметку через /addnote <текст> или посмотрите свои заметки через /notes', mainMenu));
bot.hears('♻️ Сбросить', async ctx => {
    await ctx.reply(
        'Вы точно хотите удалить весь прогресс?',
        Markup.inlineKeyboard([
            [Markup.button.callback('✅ Да', 'reset_yes'), Markup.button.callback('❌ Нет', 'reset_no')]
        ])
    );
});
bot.hears('/help', ctx => bot.telegram.sendMessage(ctx.chat.id, 'Используйте /help для справки.', mainMenu));

// --- Команда /help ---
bot.command('help', async ctx => {
    await ctx.replyWithHTML(
`<b>ℹ️ Помощь по боту</b>

<b>Возможности:</b>
• 📋 <b>Чек-лист дня</b> — персональные задачи на каждый день недели.
• 💡 <b>Мотивация</b> — вдохновляющие цитаты.
• 🔥 <b>Серия</b> — сколько дней подряд вы выполняете чек-лист на 80% и больше.
• 📈 <b>Прогресс</b> — статистика за неделю.
• 📅 <b>История</b> — прогресс за месяц.
• 🏅 <b>Достижения</b> — медали за streak и активность.
• 💡 <b>Привычка дня</b> — каждый день новая полезная привычка.
• 📝 <b>Заметки</b> — добавляйте и просматривайте свои заметки (/addnote, /notes).
• ♻️ <b>Сбросить</b> — удалить весь прогресс.
• Каждый день бот спрашивает о вашем самочувствии (оценка 1–10, стикер или слово) с возможностью добавить комментарий.
• ℹ️ <b>Помощь</b> — это сообщение.

<b>Основные команды:</b>\n 
/help — эта справка  \n 
/addnote [текст] — добавить заметку  \n 
/notes — посмотреть все заметки  \n 
/reset — сбросить прогресс

<b>Вопросы? Пишите разработчику!</b>
`, mainMenu);
});

// --- Заметки ---
bot.command('addnote', async ctx => {
    await initDB();
    const userId = ctx.from.id;
    const note = ctx.message.text.replace('/addnote', '').trim();
    if (!note) return ctx.reply('Введите текст заметки после команды, например:\n/addnote Купить молоко');
    db.data.users[userId] ||= getDefaultUser();
    db.data.users[userId].notes.push({ text: note, date: new Date().toISOString() });
    await db.write();
    ctx.reply('Заметка сохранена!');
});
bot.command('notes', async ctx => {
    await initDB();
    const userId = ctx.from.id;
    const user = db.data.users[userId] ||= getDefaultUser();
    if (!user.notes.length) return ctx.reply('У вас пока нет заметок.');
    let text = 'Ваши заметки:\n\n';
    user.notes.slice(-10).reverse().forEach((n, i) => {
        text += `${i + 1}. ${n.text} (${dayjs(n.date).format('DD.MM.YY HH:mm')})\n`;
    });
    ctx.reply(text);
});

// --- Инлайн кнопки подтверждения сброса ---
bot.action('reset_yes', async ctx => {
    await initDB();
    db.data.users[ctx.from.id] = { progress: {}, streak: 0, medals: [] };
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
    await initDB();
    const userId = ctx.from.id;
    const todayKey = getTodayKey();
    const idx = getWeekdayIndex();
    const user = db.data.users[userId] ||= { progress: {}, streak: 0, medals: [], habitsSent: [] };
    user.progress[todayKey] ||= Array(WEEKLY_CHECKLIST[idx].tasks.length).fill(false);

    const data = ctx.callbackQuery.data;
    if (data.startsWith('done_')) {
        const num = parseInt(data.split('_')[1]);
        user.progress[todayKey][num] = true;
        user.streak = calculateStreak(userId);
        checkMedals(userId);
        await db.write();

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

// --- Отправка чеклиста ---
async function sendTodayChecklist(ctx, showMenu = true) {
    await initDB();
    const idx = getWeekdayIndex();
    const userId = ctx.from.id;
    const user = db.data.users[userId] ||= { progress: {}, streak: 0, medals: [], habitsSent: [] };
    const todayKey = getTodayKey();
    user.progress[todayKey] ||= Array(WEEKLY_CHECKLIST[idx].tasks.length).fill(false);

    const text = getChecklistText(idx);
    await ctx.reply(text, getChecklistButtons(userId, idx));
    await ctx.reply(getChecklistStatus(userId, idx));
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
        "🕐 Уже час прошёл! Сделай хотя бы 1 шаг из чек-листа!",
        "🔔 Маленький шаг — тоже движение. Выполни хотя бы одно задание.",
        "⏳ Не забывай про свой чеклист — даже 1 пункт важен!",
        "💪 Ты можешь больше, чем думаешь. Сделай шаг сейчас!"
    ];
    for (const userId of users) {
        await bot.telegram.sendMessage(userId, reminders[Math.floor(Math.random() * reminders.length)]);
    }
});

// --- Ежедневная привычка дня ---
schedule.scheduleJob('0 7 * * *', async () => {
    await initDB();
    const users = Object.keys(db.data.users);
    const habit = HABITS[Math.floor(Math.random() * HABITS.length)];
    for (const userId of users) {
        await bot.telegram.sendMessage(userId, `💡 Привычка дня: ${habit}`);
    }
});

// --- Еженедельный отчёт ---
schedule.scheduleJob('0 22 * * 0', async () => {
    await initDB();
    const users = Object.keys(db.data.users);
    for (const userId of users) {
        const text = getProgressText(userId);
        const quote = getNextQuote();
        let congrats = "Неделя завершена! 🎉";
        const streak = db.data.users[userId].streak || 0;
        if (streak >= 7) congrats += ` Вы держите серию ${streak} дней подряд!`;
        await bot.telegram.sendMessage(
            userId,
            `🌟 Итоги недели:\n${text}\n\n${congrats}\n\n💡 Мотивация: ${quote}`
        );
    }
});

const WEEKLY_QUESTIONS = [
    "Что было самым сложным на этой неделе?",
    "Что далось легко?",
    "Чему ты научился(ась)?"
];

schedule.scheduleJob('5 22 * * 0', async () => {
    const db = await connectDB();
    const users = await db.collection('users').find({}).toArray();
    for (const user of users) {
        for (const q of WEEKLY_QUESTIONS) {
            await bot.telegram.sendMessage(user.userId, `📝 ${q}`);
        }
    }
});

const CHALLENGES = [
    "Попробуй новый маршрут домой.",
    "Позвони другу.",
    "Напиши 3 благодарности.",
    "Сделай 10 приседаний.",
    "Проведи 10 минут без телефона.",
    "Сделай доброе дело незаметно.",
    "Прогуляйся на свежем воздухе.",
    "Сделай уборку на рабочем месте.",
    "Почитай 10 страниц книги.",
    "Сделай запись в дневнике.",
    // Челленджи для английского
    "Выучи и запиши 3 новых английских слова.",
    "Посмотри короткое видео на английском (например, TED-ролик или мультик) и выпиши 2-3 новых слова.",
    "Попробуй повторить вслух простую английскую фразу из YouTube или приложения.",
    "Составь 2 простых предложения на английском и запиши их.",
    "Слушай 5 минут английской песни и попробуй разобрать хотя бы одно слово.",
    "Поставь на заставку телефона слово или фразу на английском — пусть весь день будет перед глазами."
];

function getRandomChallenge() {
    return CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
}

schedule.scheduleJob('2 8 * * *', async () => {
    const db = await connectDB();
    const users = await db.collection('users').find({}).toArray();
    for (const user of users) {
        const challenge = getRandomChallenge();
        await bot.telegram.sendMessage(
            user.userId,
            `🔥 Челлендж дня:\n${challenge}`,
            Markup.inlineKeyboard([
                Markup.button.callback('✅ Принять', `challenge_accept_${challenge}`),
                Markup.button.callback('❌ Отказаться', `challenge_decline`)
            ])
        );
    }
});

bot.action(/challenge_accept_(.+)/, async ctx => {
    await ctx.editMessageText(`Челлендж принят! Удачи! 💪`);
    await ctx.answerCbQuery();
});
bot.action('challenge_decline', async ctx => {
    await ctx.editMessageText('Вы отказались от челленжа на сегодня.');
    await ctx.answerCbQuery();
});

bot.launch();
console.log('Бот запущен!');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
