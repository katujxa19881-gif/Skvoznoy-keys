const { createApp, ref, computed, onMounted } = Vue;

const APP_STEPS = [
  {
    id: "step_0_init",
    stageNum: "0",
    stageName: "Постановка проблемы",
    title: "1. Инициализация папки",
    subtitle: "Создание каталога 0-подготовка/ и файлов CLAUDE.md / AGENTS.md для ИИ-инструментов",
    badgeType: "Обязательно",
    stepNumLabel: "ЭТАП 0 • ШАГ 1",
    promptTitle: "01_INIT_STRUCTURE.md",
    promptContent: `Я начинаю новый проект. Создай в текущей папке структуру для этапа 0 «Постановка проблемы».

1. Создай папку 0-подготовка/ и в ней:
   — пустые файлы:
     проблема.md, аудитория.md, портрет.md, jtbd.md
   — папку интервью/ и в ней:
     • пустой файл гайд-интервью.md
     • пустую папку транскрипты/
     • пустую папку анализ/
     • пустой файл итог-всех-интервью.md

2. В корне проекта создай:
   — файл 0-бриф.md (пустая заглушка, заполнится в конце этапа)
   — файлы CLAUDE.md и AGENTS.md с ОДИНАКОВЫМ содержимым.`,
    theoryText: `### Автоматизация рутины подготовки
Каждый проект начинается с файлов конфигураций и утилит правил (Rules files). 
Файлы **CLAUDE.md** и **AGENTS.md** сообщают ИИ-кодеру, в каких папках ведётся работа, какие стандарты оформления используются и запрещают бесконтрольные перезаписи без подтверждения!
Это защитит ваш код от самовольных перезапусков и сохранит историю брифа.`
  },
  {
    id: "step_0_problem",
    stageNum: "0",
    stageName: "Постановка проблемы",
    title: "2. Формулировка проблемы",
    subtitle: "Анализ и сжатие проблемы по шаблону: «Когда [контекст], я как [роль] хочу [результат]...»",
    badgeType: "Обязательно",
    stepNumLabel: "ЭТАП 0 • ШАГ 2",
    promptTitle: "02_PROBLEM.TXT",
    promptContent: `Контекст: продукт типа внутренний — для использования внутри моей компании сотрудниками.
Моя черновая формулировка проблемы:
««ИДЕЯ»»

ШАГ 1. Задай мне 10 уточняющих вопросов как продакт-менеджер, чтобы проверить:
— это проблема, а не готовое решение
— есть ли у неё носители и насколько она болезненна
— как люди справляются с этим прямо сейчас
На этом шаге только задавай вопросы, не давай готовых советов. Жди моих ответов.

ШАГ 2. После моих ответов — выведи итоговую формулировку проблемы по шаблону:
«Когда [контекст], я как [роль] хочу [результат], потому что [мотивация]. Сейчас [как справляюсь] — это [боль/последствие]» .`,
    theoryText: `### Методология формулировки проблем
Главная ошибка начинающих фаундеров и ИИ-кодеров — программирование решений до ясной формулировки проблемы. 
Шаблон **«Когда... я как... хочу... чтобы...»** жестко разворачивает фокус на человека. 
Запрещено использовать слова «приложение», «сайт», «бот» или «сервис» при описании боли!`
  },
  {
    id: "step_0_audience",
    stageNum: "0",
    stageName: "Постановка проблемы",
    title: "3. Определение аудитории",
    subtitle: "Идентификация сегментов ЦА и стейкхолдеров через структурированный ИИ-опрос",
    badgeType: "Обязательно",
    stepNumLabel: "ЭТАП 0 • ШАГ 3",
    promptTitle: "03_AUDIENCE.TXT",
    promptContent: `Контекст: продукт типа [внутренний].
Формулировка проблемы хранится в файле 0-подготовка/проблема.md в папке проекта. Прочитай её.

Определяем целевую аудиторию — кто из сотрудников будет пользоваться ежедневно, а кто принимает решение об интеграции и оплате.

Проведи интервью по 1–2 вопроса — без советов. Темы:
— Кто работает ежедневно? Кто получает результаты?
— Кто принимает решения? Кто может сопротивляться внедрению?
Собери итоговый список ролей с их мотивацией.`,
    theoryText: `### Сегментирование ЦА
Даже у микро-продукта всегда больше одного пользователя. 
Вам нужно разделять:
1. **Конечные пользователи** (End Users) — те, чьими руками совершается транзакция.
2. **Лица, принимающие решения** (Decision Makers) — те, кто утверждают бюджет и дарят зелёный свет.
3. **Саботёры** — сотрудники, чьи процессы ломаются из-за нового ПО.`
  },
  {
    id: "step_0_portrait",
    stageNum: "0",
    stageName: "Постановка проблемы",
    title: "4. Портрет пользователя",
    subtitle: "Формирование гипотезы о роли, типичном рабочем процессе и главных болях персоны",
    badgeType: "Обязательно",
    stepNumLabel: "ЭТАП 0 • ШАГ 4",
    promptTitle: "04_PORTRAIT.TXT",
    promptContent: `Помоги составить портрет пользователя.
Источники в проекте:
• 0-подготовка/проблема.md — формулировка проблемы,
• 0-подготовка/аудитория.md — целевая аудитория.

Составь детальный портрет по 8 ключевым пунктам:
1. Роль, должность и рабочий контекст
2. Типичный дневной процесс работы
3. Главные боли и раздражение текущего дня
4. Задачи, которые он реально решает
5. Инструменты в его арсенале на сегодня
6. Что раздражает в текущем способе больше всего
7. Что боится потерять или поломать при автоматизации
8. Метрики успеха — как измеряется его полезность`,
    theoryText: `### Персона-моделирование (User Persona)
Портрет пользователя — это не абстрактный «мужчина 25-45 лет». Это конкретный портрет конкретной рабочей роли. 
Мы описываем страхи, инструменты и метрики успешности сотрудника, чтобы продукт помогал ему расти в компании, а не создавал лишнюю бюрократию.`
  },
  {
    id: "step_0_jtbd",
    stageNum: "0",
    stageName: "Постановка проблемы",
    title: "5. Проектирование JTBD Mapping",
    subtitle: "Фиксация Jobs To Be Done (функциональных, эмоциональных, социальных уровней)",
    badgeType: "Обязательно",
    stepNumLabel: "ЭТАП 0 • ШАГ 5",
    promptTitle: "05_JTBD_MAPPING.TXT",
    promptContent: `Помоги сформулировать JTBD (Jobs To Be Done) карту.
Прочитай все файлы: проблема.md, аудитория.md, портрет.md.

ШАГ 1. Сначала задай мне 6–8 вопросов по 1–2 за раз:
— В каких именно ситуациях возникает данная работа?
— Что конкретно подталкивает человека начать действовать?
— Какой результат он считает идеальным решением?

ШАГ 2. Сгенерируй 5-8 работ по формуле JTBD:
«Когда [ситуация], я хочу [результат], чтобы [мотивация]».
Разложи на уровни: Функциональный, Эмоциональный и Социальный.`,
    theoryText: `### Фреймворк JTBD
Люди «нанимают» продукты на работу для выполнения определенной задачи. 
Фреймворк **Jobs To Be Done** фокусируется на прогрессе пользователя в конкретных обстоятельствах. 
Каждая работа делится на:
- **Функциональную**: сделать задачу без ошибок.
- **Эмоциональную**: почувствовать спокойствие и уверенность.
- **Социальную**: выглядеть профессионалом в глазах своего руководства.`
  },
  {
    id: "step_0_guide",
    stageNum: "0",
    stageName: "Постановка проблемы",
    title: "6. Гайд-интервью для CustDev",
    subtitle: "Проработка цепочки вопросов без подсказок и навязывания решения для глубинных интервью",
    badgeType: "Обязательно",
    stepNumLabel: "ЭТАП 0 • ШАГ 6",
    promptTitle: "06_CUSTDEV_GUIDE.TXT",
    promptContent: `Помоги составить гайд для проведения глубинного CustDev-интервью.
Собеседник: [Введи роль, например: Руководитель отдела продаж]

Составь 7 тем (по 2-3 сильных открытых вопроса в каждой):
1. Текущий процесс решения задачи
2. Последний реальный случай, когда возникла данная проблема
3. Что больше всего не устроило в прошлый раз
4. Что, наоборот, нравится в текущем способе решения (нельзя удалять это!)
5. Чего не хватает в идеале
6. Какие альтернативы уже пробовали, и почему они провалились
7. Реальные потери и последствия если проблема не будет решена вовсе`,
    theoryText: `### CustDev (Глубинные интервью)
Худшее интервью — когда вы презентуете идею и спрашиваете: «Купите ли вы это?». Пользователи ответят «Да», чтобы быть вежливыми. 
Правильный CustDev говорит **только о прошлом опыте** респондента. Спрашивайте «Как вы решали это в последний раз?» вместо «Как бы вы платили за наше ПО?»`
  },
  {
    id: "step_0_analysis_summary",
    stageNum: "0",
    stageName: "Постановка проблемы",
    title: "7. Сводный анализ интервью",
    subtitle: "Обобщение болей, инсайтов и паттернов по всем проведенным беседам",
    badgeType: "Сводка",
    stepNumLabel: "ЭТАП 0 • ШАГ 8",
    promptTitle: "08_INTERVIEW_SUMMARY.TXT",
    promptContent: `Прочитай файлы анализов отдельных интервью из папки 0-подготовка/интервью/анализ/*.md.
Составь безжалостно честный свод интервью:
— Что повторили абсолютно все респонденты (сильный паттерн)?
— Что встретилось только 1-2 раза (слабый сигнал / гипотеза)?
— Какие из наших стартовых болей НЕ подтвердились на живых людях?
— Какие боли оказались глубже и критичнее, чем мы ожидали?`,
    theoryText: `### Анализ качественных данных
Синтез результатов CustDev бережёт проект от ложных иллюзий. 
Если из 5 пообщавшихся сотрудников никто не назвал вашу "ключевую боль" проблемой — значит её не существует, и пилить этот функционал бессмысленно. 
Останавливайте разработку и меняйте фокус.`
  },
  {
    id: "step_1_audit",
    stageNum: "1",
    stageName: "Докрутка идеи",
    title: "8. Проверка структуры этапа 1",
    subtitle: "Создание папки 1-идея/ и подготовка шаблона визитки продукта",
    badgeType: "Обязательно",
    stepNumLabel: "ЭТАП 1 • ШАГ 1",
    promptTitle: "01_INIT_IDEA.md",
    promptContent: `Я начинаю этап 1 «Докрутка идеи».
Создай папку 1-идея/ в корне проекта.
В ней размести пустые файлы:
— варианты.md
— выбранный-вариант.md
— визитка.md
— проверка-визитки.md

Обнови базу CLAUDE.md и AGENTS.md информацией о структуре этапа 1.`,
    theoryText: `### Вход в этап 1
На этом этапе мы берём сырые боли и формируем из них концепцию жизнеспособного решения. Студенты разрабатывают гипотезы ценности и формируют легенду — фразу-визитку, которая моментально объясняет ценность за 15 секунд.`
  },
  {
    id: "step_1_pitch",
    stageNum: "1",
    stageName: "Докрутка идеи",
    title: "9. Elevator Pitch и Визитка",
    subtitle: "Составление лаконичного позиционирования проекта по жесткой формуле",
    badgeType: "Обязательно",
    stepNumLabel: "ЭТАП 1 • ШАГ 4",
    promptTitle: "04_ELEVATOR_PITCH.TXT",
    promptContent: `Помоги составить фразу-визитку продукта по жесткому шаблону:
«Для [кого], которые [описание проблемы],
наш продукт [авторское решение / что делает],
в отличие от [как справляются сейчас],
он [в чём ключевая ценность и почему мы лучше]».

Предложи 4 варианта с разными акцентами:
— С уклоном в экономию времени
— С уклоном в удобство и минимизацию ошибок
— С уклоном в контроль и автоматизацию процесса.`,
    theoryText: `### Искусство Elevator Pitch
Если вы не можете объяснить суть продукта за одну фразу по шаблону визитки — вы сами не до конца понимаете, что создаёте. 
Качественная визитка исключает воду вроде "уникальный инновационный ультра-инструмент". Она бьёт фактами.`
  }
];

const App = {
  template: `
    <div class="min-h-screen flex flex-col font-sans bg-[#020713] text-gray-100">
      
      <!-- HEADER -->
      <header class="border-b border-emerald-500/10 bg-[#040d1e] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-50 shadow-md">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center animate-pulse">
            <span class="font-mono text-emerald-400 font-extrabold text-sm">AI</span>
          </div>
          <div>
            <h1 class="text-sm font-extrabold tracking-widest uppercase text-white font-mono flex items-center gap-2">
              AI PRODUCT GUIDE
              <span class="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-400/20">
                ОФЛАЙН КУРСУС
              </span>
            </h1>
            <p class="text-[10px] text-gray-400 font-mono">Автономный интерактивный учебник студента</p>
          </div>
        </div>
        
        <div class="flex items-center gap-4">
          <div class="bg-black/40 border border-white/5 rounded-lg px-3 py-1 flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span class="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider">
              Локальный Режим: Активен
            </span>
          </div>
          <button @click="downloadAllDrafts" class="bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-bold uppercase tracking-wider py-1.5 px-3 rounded-md transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            💾 Выгрузить Черновики (.json)
          </button>
        </div>
      </header>

      <!-- MAIN CONTENT -->
      <main class="flex-1 grid grid-cols-1 xl:grid-cols-12 overflow-hidden h-[calc(100vh-68px)]">
        
        <!-- SIDEBAR: STEPS (3 Cols) -->
        <aside class="xl:col-span-3 border-r border-white/10 bg-[#030b18] overflow-y-auto p-4 flex flex-col space-y-3 custom-scrollbar">
          <div class="text-[10px] uppercase font-mono tracking-widest text-[#00ff85] font-bold pb-2 border-b border-white/10 flex items-center justify-between">
            <span>📚 Шаги Учебного Плана</span>
            <span class="text-gray-400">({{ steps.length }}/{{ steps.length }})</span>
          </div>

          <div class="space-y-1.5">
            <div 
              v-for="(step, idx) in steps" 
              :key="step.id"
              @click="selectStep(idx)"
              class="group p-3 rounded-lg border cursor-pointer transition-all flex flex-col space-y-1.5"
              :class="currentIdx === idx ? 'bg-[#00ff85]/5 border-[#00ff85]/40 text-white' : 'bg-black/20 border-white/5 text-gray-400 hover:bg-white/5 hover:text-white'"
            >
              <div class="flex items-center justify-between select-none">
                <span class="font-mono text-[9px] uppercase tracking-wider" :class="currentIdx === idx ? 'text-[#00ff85]' : 'text-gray-500'">
                  {{ step.stepNumLabel }}
                </span>
                <span class="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium border"
                  :class="step.badgeType === 'Обязательно' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-[#00ff85]/10 border-[#00ff85]/20 text-[#00ff85]'">
                  {{ step.badgeType }}
                </span>
              </div>
              <h3 class="text-xs font-extrabold font-mono" :class="currentIdx === idx ? 'text-white' : 'text-gray-300 group-hover:text-white'">
                {{ step.title }}
              </h3>
              <p class="text-[10px] text-gray-400 leading-normal line-clamp-1">
                {{ step.subtitle }}
              </p>
            </div>
          </div>
        </aside>

        <!-- CENTER WORKSPACE: THEORY & PROMPTS (5 Cols) -->
        <section class="xl:col-span-5 p-5 flex flex-col space-y-4 border-r border-white/10 overflow-y-auto custom-scrollbar bg-black/10">
          
          <!-- TAB SWITCHER -->
          <div class="flex border-b border-white/10 pb-0.5 gap-2">
            <button 
              @click="activeTab = 'prompt'"
              class="font-mono text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 border-b-2 transition-all"
              :class="activeTab === 'prompt' ? 'border-[#00ff85] text-[#00ff85]' : 'border-transparent text-gray-400 hover:text-white'"
            >
              📋 Промпт для ИИ
            </button>
            <button 
              @click="activeTab = 'theory'"
              class="font-mono text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 border-b-2 transition-all"
              :class="activeTab === 'theory' ? 'border-[#00ff85] text-[#00ff85]' : 'border-transparent text-gray-400 hover:text-white'"
            >
              📚 Теория и Смысл Шага
            </button>
          </div>

          <!-- PROMPT VIEW -->
          <div v-if="activeTab === 'prompt'" class="flex-1 flex flex-col space-y-4 justify-between">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span class="font-mono text-xs font-bold text-white tracking-widest uppercase">
                  ФАЙЛ: {{ currentStep.promptTitle }}
                </span>
              </div>
              <span class="text-[10px] text-gray-400 font-mono">ФОРМАТ: MARKDOWN</span>
            </div>

            <!-- PROMPT TEXTBOARD -->
            <div class="relative bg-black/60 rounded-xl p-4 border border-white/10 overflow-y-auto max-h-[360px] custom-scrollbar text-[#00ff85] font-mono text-[11px] leading-relaxed select-text">
              <span class="absolute top-2 left-2 text-white/10 text-3xl font-serif">“</span>
              <div class="pl-4 pr-2 whitespace-pre-wrap py-2 select-text font-mono">
                {{ formattedPromptContent }}
              </div>
              <span class="absolute bottom-2 right-2 text-white/10 text-3xl font-serif">”</span>
            </div>

            <div class="space-y-2">
              <button 
                @click="copyPromptToClipboard" 
                class="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-[#00ff85] hover:brightness-110 active:scale-[0.98] text-black px-4 py-2.5 rounded-lg text-xs font-mono font-extrabold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(0,255,133,0.15)]"
              >
                <span>{{ copied ? '📋 СКОПИРОВАНО В БУФЕР ОБМЕНА!' : '📋 СКОПИРОВАТЬ ЭТОТ ПРОМПТ ДЛЯ ИИ' }}</span>
              </button>
              <p class="text-[10px] text-center text-gray-400 font-mono">Вставьте этот промпт в вашу ИИ-сессию (ChatGPT, Claude, Gemini, etc.)</p>
            </div>
          </div>

          <!-- THEORY VIEW -->
          <div v-if="activeTab === 'theory'" class="flex-1 space-y-4">
            <div class="flex items-center gap-2 border-b border-white/5 pb-2">
              <span class="font-mono text-xs font-bold text-gray-300 uppercase tracking-widest">
                📚 Академический Учебник
              </span>
            </div>
            
            <div class="p-4 bg-white/5 border border-white/5 rounded-xl space-y-3">
              <h4 class="text-xs font-extrabold text-[#00ff85] uppercase tracking-wider font-mono">
                Методологическая суть:
              </h4>
              <p class="text-xs text-gray-300 leading-relaxed font-sans whitespace-pre-line">
                {{ currentStep.theoryText }}
              </p>
            </div>
            
            <div class="p-4 bg-black/40 border border-[#00ff85]/10 rounded-xl space-y-2">
              <h4 class="text-xs font-mono font-bold text-white uppercase">💡 Лайфхак для Студента:</h4>
              <p class="text-[11px] text-gray-400 leading-relaxed">
                Пользуйтесь ИИ как въедливым и дотошным научным руководителем. Никогда не соглашайтесь на первый ответ, требуйте критиковать и уплотнять формулировки!
              </p>
            </div>
          </div>

        </section>

        <!-- RIGHT SIDE: DRAFT WORKSPACE (4 Cols) -->
        <section class="xl:col-span-4 p-5 flex flex-col space-y-4 bg-[#030a17]">
          
          <div class="flex items-center justify-between border-b border-white/10 pb-2">
            <span class="font-mono text-xs font-bold text-emerald-400 uppercase tracking-widest">
              ✍️ Интерактивный Черновик
            </span>
            <span class="text-[9px] text-gray-400 font-mono">Автосохранение</span>
          </div>

          <!-- USER IDEA FIELD ON STEP 2 OR ALWAYS -->
          <div class="space-y-2">
            <label class="text-[10px] font-mono uppercase tracking-widest text-gray-300 block font-bold">
              Идея вашего ИИ-продукта (для автоподстановки в промпты):
            </label>
            <input 
              v-model="userIdea" 
              placeholder="Напишите вашу черновую идею, например: Бот для умного перевода встреч..." 
              class="w-full bg-black/40 text-xs font-mono font-medium rounded-lg border border-white/10 focus:border-[#00ff85] focus:outline-none p-2.5 text-[#00ff85]"
            />
          </div>

          <!-- DRAFT TEXTAREA -->
          <div class="flex-1 flex flex-col space-y-2">
            <label class="text-[10px] font-mono uppercase tracking-widest text-gray-300 block font-bold">
              Поле для ваших мыслей и артефакта шага:
            </label>
            <textarea 
              v-model="blackboards[currentStep.id]" 
              placeholder="Вставляйте сюда промежуточные мысли, ответы ИИ, транскрипты, или финальный итог шага. Ваши записи сохраняются автоматически в браузере..."
              class="flex-1 w-full bg-black/60 rounded-xl p-3 border border-white/10 text-xs text-white leading-relaxed focus:border-[#00ff85]/50 focus:outline-none font-mono resize-none"
            ></textarea>
          </div>

          <div class="bg-black/30 p-2.5 border border-white/5 rounded-lg">
            <div class="text-[9px] font-mono text-gray-500 uppercase tracking-wider mb-1 block">Ваш прогресс по курсу:</div>
            <div class="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div class="bg-emerald-400 h-1.5 rounded-full transition-all duration-300" :style="{ width: progressPercentage + '%' }"></div>
            </div>
            <div class="flex justify-between items-center mt-2">
              <span class="text-[10px] font-mono text-gray-400">Шаг {{ currentIdx + 1 }} из {{ steps.length }}</span>
              <span class="text-[10px] font-mono text-emerald-400 font-bold">{{ progressPercentage }}%</span>
            </div>
          </div>

          <!-- DRAFT ACTION BAR -->
          <div class="grid grid-cols-2 gap-2 pt-2">
            <button 
              @click="downloadCurrentStepDraft" 
              class="flex items-center justify-center gap-1 bg-[#041221] hover:bg-[#071f39] border border-[#00ff85]/20 text-[#00ff85] font-mono text-[10px] font-bold uppercase tracking-wider py-2 rounded transition-all"
            >
              Скачать Текст Шага
            </button>
            <button 
              @click="clearCurrentStepDraft" 
              class="flex items-center justify-center gap-1 bg-red-950/20 hover:bg-red-950/50 border border-red-500/20 text-red-400 font-mono text-[10px] font-bold uppercase tracking-wider py-2 rounded transition-all"
            >
              Очистить поле
            </button>
          </div>

        </section>

      </main>

    </div>
  `,
  setup() {
    const steps = APP_STEPS;
    const currentIdx = ref(0);
    const activeTab = ref("prompt");
    const copied = ref(false);
    const userIdea = ref("Умный бот-секретарь для автоматического протоколирования Zoom-совещаний");
    
    // Key-value store for user drafts for each step
    const blackboards = ref({});

    const currentStep = computed(() => steps[currentIdx.value]);

    onMounted(() => {
      // Load userDrafts and userIdea from localStorage if available
      try {
        const storedIdea = localStorage.getItem("ai_product_guide_idea");
        if (storedIdea) {
          userIdea.value = storedIdea;
        }
        
        const storedBlackboards = localStorage.getItem("ai_product_guide_drafts");
        if (storedBlackboards) {
          blackboards.value = JSON.parse(storedBlackboards);
        } else {
          // Initialize empty drafts for all steps
          const drafts = {};
          steps.forEach(st => {
            drafts[st.id] = "";
          });
          blackboards.value = drafts;
        }
      } catch (err) {
        console.error("Local storage error on initialization: ", err);
      }
    });

    // Auto-save values to localStorage when typed
    Vue.watch(userIdea, (newVal) => {
      try {
        localStorage.setItem("ai_product_guide_idea", newVal);
      } catch (err) {}
    });

    Vue.watch(blackboards, (newVal) => {
      try {
        localStorage.setItem("ai_product_guide_drafts", JSON.stringify(newVal));
      } catch (err) {}
    }, { deep: true });

    const formattedPromptContent = computed(() => {
      let content = currentStep.value.promptContent || "";
      if (userIdea.value) {
        // Automatically inject customized draft parameters in live time
        content = content.replace(/«ИДЕЯ»/g, `«${userIdea.value}»`);
        content = content.replace(/«\(впиши свою формулировку проблемы в поле слева на этом слайде\)»/g, `«${userIdea.value}»`);
        content = content.replace(/\[внутренний\]/g, `[${userIdea.value}]`);
        content = content.replace(/\[Введи роль, например: Руководитель отдела продаж\]/g, `👤 ${userIdea.value}`);
      }
      return content;
    });

    const progressPercentage = computed(() => {
      let filledStepCount = 0;
      steps.forEach(st => {
        if (blackboards.value[st.id] && blackboards.value[st.id].trim().length > 15) {
          filledStepCount++;
        }
      });
      return Math.round((filledStepCount / steps.length) * 100);
    });

    function selectStep(idx) {
      currentIdx.value = idx;
      copied.value = false;
    }

    function copyPromptToClipboard() {
      navigator.clipboard.writeText(formattedPromptContent.value).then(() => {
        copied.value = true;
        setTimeout(() => { clickedCopiedToFalse(); }, 2000);
      });
    }

    function clickedCopiedToFalse() {
      copied.value = false;
    }

    function downloadCurrentStepDraft() {
      const stepText = blackboards.value[currentStep.value.id] || "";
      if (!stepText.trim()) {
        alert("Черновик пуст! Пожалуйста, напишите или скопируйте сюда результаты взаимодействия с ИИ.");
        return;
      }
      const blob = new Blob([`### ${currentStep.value.title}\n\n${stepText}`], { type: "text/plain;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Draft_${currentStep.value.id}.md`;
      link.click();
    }

    function clearCurrentStepDraft() {
      if (confirm("Вы действительно хотите очистить поле для текущего шага?")) {
        blackboards.value[currentStep.value.id] = "";
      }
    }

    function downloadAllDrafts() {
      const dataForExport = {
        meta: {
          exportDate: new Date().toISOString(),
          productIdea: userIdea.value
        },
        drafts: blackboards.value
      };
      
      const blob = new Blob([JSON.stringify(dataForExport, null, 2)], { type: "application/json;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `AI_Product_Guide_All_Drafts.json`;
      link.click();
    }

    return {
      steps,
      currentIdx,
      currentStep,
      activeTab,
      copied,
      userIdea,
      blackboards,
      formattedPromptContent,
      progressPercentage,
      selectStep,
      copyPromptToClipboard,
      downloadCurrentStepDraft,
      clearCurrentStepDraft,
      downloadAllDrafts
    };
  }
};

createApp(App).mount('#app');
