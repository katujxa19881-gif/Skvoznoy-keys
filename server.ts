import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of GoogleGenAI SDK client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined. Please set it via AI Studio Settings Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Interactive chat route with AI Coach
app.post("/api/chat-coach", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Введите сообщение." });
    }

    const ai = getGeminiClient();

    const systemInstruction = `Вы — ИИ-наставник (AI Coach) по созданию AI-продуктов.
Ваша цель — помогать студенту проходить интерактивный курс "AI Product Guide".
Помогайте ему разрабатывать его ИИ-продукт, комментируйте гипотезы, советуйте подходящие инструменты, хвалите за прогресс.
Отвечайте на русском языке. Будьте конструктивны, вежливы и экспертны в области продакт-менеджмента и искусственного интеллекта.`;

    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction,
      },
    });

    const response = await chat.sendMessage({ message });
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in /api/chat-coach:", error);
    res.status(500).json({ error: error.message || "Ошибка при генерации ответа ИИ." });
  }
});

// Generate Tailored artifacts/framework based on user's custom product idea
app.post("/api/generate-step", async (req, res) => {
  try {
    const { stepId, userIdea } = req.body;
    if (!userIdea || userIdea.trim() === "") {
      return res.status(400).json({ error: "Пожалуйста, опишите вашу идею продукта." });
    }

    const ai = getGeminiClient();

    let prompt = "";
    const systemInstruction = "Вы — экспертный ИИ-архитектор продуктов и продакт-менеджер. Отвечайте на русском языке.";

    switch (stepId) {
      case "step_2":
        prompt = `Идея продукта пользователя: "${userIdea}"
Создайте структуру папок для этапа 0 проекта. Расскажите кратко, какое назначение у каждого файла в контексте идеи пользователя.`;
        break;
      case "step_3":
      case "problems":
        prompt = `Идея продукта пользователя: "${userIdea}"
Для этой идеи проведите Анализ Проблемы.
1. Сформулируйте 3 ключевые боли потенциальных пользователей или рынка.
2. Продемонстрируйте метод "5 Почему" (5 Whys) для выявления корневой проблемы.
Форматируйте ответ красиво в Markdown.`;
        break;
      case "jtbd":
        prompt = `Идея продукта пользователя: "${userIdea}"
Сформулируйте ровно 5 подробных пользовательских историй по методологии Jobs-to-be-Done (JTBD) в формате "Job Stories":
"Когда я [ситуация], я хочу [действие/возможность], чтобы я мог [результат/ценность]".
Форматируйте в виде списка в Markdown.`;
        break;
      case "step_5":
      case "interview":
        prompt = `Идея продукта пользователя: "${userIdea}"
Твоя задача — сгенерировать детальный ГАЙД ИНТЕРВЬЮ для общения с потенциальными пользователями.
Включи:
- Вступление и "разогрев" (2-3 вопроса)
- Проверку проблемы (как они решают её сейчас?) (2-3 вопроса)
- Вопросы на поиск "боли" и затрат (времени/денег) (2-3 вопроса)
- Проверку готовности платить (1-2 вопроса)
Форматируйте красиво в Markdown.`;
        break;
      case "step_6":
      case "brief":
        prompt = `Идея продукта пользователя: "${userIdea}"
Составь финальный бриф проекта. Структура:
- **Название продукта**: Краткое и оригинальное название.
- **Миссия**: Какую главную проблему решаем.
- **Целевая аудитория**: Кто наш идеальный пользователь.
- **Ключевые фичи**: Список из 3-5 функций, закрывающих JTBD.
- **Технологический стек (предложение)**: Предложи современные библиотеки и стек для ИИ.
- **Ограничения**: Что мы НЕ делаем в MVP.
Форматируйте в Markdown.`;
        break;
      case "step_7":
      case "types":
        prompt = `Идея продукта пользователя: "${userIdea}"
Как классифицируется этот продукт в соответствии с классификацией курса? 
Проанализируйте его перспективы по трем категориям продукта:
A. Внешний продукт (клиентский рынок, конкуренты, бизнес)
B. Внутренний продукт (автоматизация в компании, интеграция в процессы)
C. Личный / нишевый (быстрая утилита или нишевый инструмент для себя)
Какая категория подходит лучше всего и почему? Какой идеальный путь развития?
Форматируйте в Markdown.`;
        break;
      case "step_8":
      case "designer":
        prompt = `Идея продукта пользователя: "${userIdea}"
Сгенерируйте ИИ-промпт UI-дизайнера для логики GlobalNav и ключевых экранов этого продукта.
Включите:
- Роль и Контекст
- Описание GlobalNav
- Спецификацию визуальных элементов с акцентами
- Сценарий Synthetic UX-тестирования.
Форматируйте красиво в Markdown.`;
        break;
      case "step_9":
      case "sprint":
        prompt = `Идея продукта пользователя: "${userIdea}"
Выступи в роли Agile-коуча и системного архитектора. Разработай бэклог первого спринта:
1. Выдели 2 Эпика.
2. Сформируй по 3 Истории для каждого Эпика с 3 техническими критериями приемки (Acceptance Criteria) и оценкой в стори-поинтах (Фибоначчи).
Выведи результат в виде красивой таблицы Markdown.`;
        break;
      case "step_10":
      case "security":
        prompt = `Идея продукта пользователя: "${userIdea}"
Сформируй протокол сканирования уязвимостей и ИИ-аудита безопасности.
Опиши:
1. Топ-3 уязвимостей (Prompt Injection, API утечка, etc.) для этого продукта.
2. Правила фильтрации PII (конфиденциальность).
3. Способы состязательной защиты.
Вывод оформи в красивом Markdown.`;
        break;
      case "step_11":
      case "gtm":
        prompt = `Идея продукта пользователя: "${userIdea}"
Разработай Growth-Hacking стратегию и план A/B тестирования для дня запуска.
Сформулируй:
1. Основной KPI (например, Retention, Activation).
2. Переменную А (Маркетинговые месседжи) и Переменную Б (Процесс онбординга).
3. Список из 3 экспериментов для быстрого роста GTM.
Оформи в Markdown.`;
        break;
      case "step_12":
        prompt = `Идея продукта пользователя: "${userIdea}"
Разработайте техническую архитектуру базы данных и микросервисов для ИИ-решения.
1. Постройте схему реляционной или векторной БД в SQL DDL (таблицы пользователей, логов взаимодействия, сессий ИИ, и хранения текстов/векторов).
2. Опишите структуру хранения векторных эмбеддингов, Tenant Изоляции, и кэширования LLM в Redis.
Оформи в Markdown с примерами кода и SQL.`;
        break;
      case "step_13":
        prompt = `Идея продукта пользователя: "${userIdea}"
Спроектируйте архитектуру MVP и базовые классы/компоненты на FastAPI / Node.js и React.
Дайте пример кода ключевых ИИ-интеграций в MVP (например, вызов Gemini API, получение ответов, рендеринг в UI). Оформи в Markdown.`;
        break;
      case "step_14":
        prompt = `Идея продукта пользователя: "${userIdea}"
Напишите набор Unit и Integration тестовых сценариев (например, на Jest / TypeScript) для проверки логики ИИ-модели, валидации токенов, PII очистки данных, и обработки ошибок API. Оформи в Markdown.`;
        break;
      case "step_15":
        prompt = `Идея продукта пользователя: "${userIdea}"
Сформируйте конфигурации Kubernetes Deployment и CI/CD GitHub Actions для автоматической сборки, деплоя и запуска этого ИИ-приложения в облако. Оформи в Markdown.`;
        break;
      case "step_16":
        prompt = `Идея продукта пользователя: "${userIdea}"
Разработайте 30-дневную стратегию вывода на рынок (GTM) и создания ИИ-контента для промоушена этого продукта на Product Hunt, Reddit и X. Оформи в Markdown.`;
        break;
      case "step_17":
        prompt = `Идея продукта пользователя: "${userIdea}"
Спроектируйте воронку продаж, CRM-интеграцию и алгоритм Lead Scoring для этого ИИ-продукта. Напишите шаблоны автоматических писем для конвертации клиентов. Оформи в Markdown.`;
        break;
      case "step_18":
        prompt = `Идея продукта пользователя: "${userIdea}"
Разработайте систему метрик поведения пользователей, Sentiment Analysis (анализа тональности отзывов) и Pareto распределения фрикций, с примерами отчетов ИИ-аналитики. Оформи в Markdown.`;
        break;
      case "step_19":
        prompt = `Идея продукта пользователя: "${userIdea}"
Разработайте стратегию масштабирования ИИ-вычислений: конфигурацию Kubernetes HPA (HorizontalPodAutoscaler) и подходы к оптимизации задержки вывода ИИ (Quantization, TensorRT). Оформи в Markdown.`;
        break;
      case "step_20":
        prompt = `Идея продукта пользователя: "${userIdea}"
Выступи в роли AI Product Manager. Проанализируйте логи обратной связи пользователей продукта, приоритезируйте топ-3 фичи по фреймворку RICE и предложите стратегию вовлечения сообщества. Оформи в Markdown.`;
        break;
      default:
        return res.status(400).json({ error: "Недопустимый идентификатор шага" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in /api/generate-step:", error);
    res.status(500).json({ error: error.message || "Ошибка генерации артефактов." });
  }
});

// Configure Vite middleware in development or static serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started on port ${PORT}`);
  });
}

setupServer();
