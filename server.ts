import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
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

// Function to find line range for a Stage in doc-content.txt
function getStageLines(lines: string[], stageNum: string): string[] {
  let startIndex = -1;
  let endIndex = -1;

  const targetRegex = new RegExp("^Этап\\s+" + stageNum + "(\\b|\\s|-)", "i");

  for (let i = 0; i < lines.length; i++) {
    if (targetRegex.test(lines[i])) {
      startIndex = i;
      break;
    }
  }

  if (startIndex === -1) {
    const stageStarts: Record<string, number> = {
      "0": 0,
      "1": 861,
      "2": 1398,
      "3": 1916,
      "4": 2363,
      "5": 3070,
      "6": 3911,
      "7": 4308,
      "8": 4625,
      "9": 4968,
      "10": 5284,
      "11": 5624,
      "12": 6221,
      "13": 6848
    };
    startIndex = stageStarts[stageNum] !== undefined ? stageStarts[stageNum] : -1;
  }

  if (startIndex !== -1) {
    const nextStageNum = (parseInt(stageNum, 10) + 1).toString();
    const nextRegex = new RegExp("^Этап\\s+" + nextStageNum + "(\\b|\\s|-)", "i");
    for (let i = startIndex + 1; i < lines.length; i++) {
      if (nextRegex.test(lines[i])) {
        endIndex = i;
        break;
      }
    }
    if (endIndex === -1) {
      endIndex = lines.length;
    }
    return lines.slice(startIndex, endIndex);
  }

  return [];
}

// Route to get step-by-step theory textbook content dynamically
app.post("/api/get-theory", (req, res) => {
  try {
    const { stageNum, stepTitle, stepSubtitle } = req.body;
    if (stageNum === undefined || !stepTitle) {
      return res.status(400).json({ error: "stageNum and stepTitle are required." });
    }

    const docPath = path.join(process.cwd(), "doc-content.txt");
    if (!fs.existsSync(docPath)) {
      return res.json({ stageIntroduction: "Текстовые материалы (doc-content.txt) не найдены на сервере.", stepTheory: "" });
    }

    const fileContent = fs.readFileSync(docPath, "utf-8");
    const lines = fileContent.split(/\r?\n/);

    const stageLines = getStageLines(lines, stageNum);
    if (stageLines.length === 0) {
      return res.json({ 
        stageIntroduction: `Материалы для этапа ${stageNum} временно недоступны.`, 
        stepTheory: "" 
      });
    }

    const stepIndices: number[] = [];
    for (let i = 0; i < stageLines.length; i++) {
      const l = stageLines[i].trim();
      if (l.startsWith("Шаг ") || l.match(/^Шаг\s+\d+/i)) {
        stepIndices.push(i);
      }
    }

    let stageIntroduction = "";
    if (stepIndices.length > 0) {
      stageIntroduction = stageLines.slice(0, stepIndices[0]).join("\n");
    } else {
      stageIntroduction = stageLines.join("\n");
    }

    const matchNum = stepTitle.match(/^(\d+)\./);
    const targetStepNumber = matchNum ? parseInt(matchNum[1], 10) : null;

    let stepTheory = "";
    if (targetStepNumber !== null && stepIndices.length > 0) {
      let foundIndex = -1;
      for (let idx = 0; idx < stepIndices.length; idx++) {
        const lineStr = stageLines[stepIndices[idx]].trim();
        const numMatch = lineStr.match(/^Шаг\s+(\d+)/i);
        if (numMatch && parseInt(numMatch[1], 10) === targetStepNumber) {
          foundIndex = idx;
          break;
        }
      }

      if (foundIndex === -1) {
        const cleanTitle = stepTitle.replace(/^\d+\.\s*/, "").toLowerCase().slice(0, 10);
        for (let idx = 0; idx < stepIndices.length; idx++) {
          const lineStr = stageLines[stepIndices[idx]].toLowerCase();
          if (lineStr.includes(cleanTitle)) {
            foundIndex = idx;
            break;
          }
        }
      }

      if (foundIndex === -1 && targetStepNumber - 1 < stepIndices.length) {
        foundIndex = targetStepNumber - 1;
      }

      if (foundIndex !== -1) {
        const startIdx = stepIndices[foundIndex];
        const endIdx = foundIndex < stepIndices.length - 1 ? stepIndices[foundIndex + 1] : stageLines.length;
        stepTheory = stageLines.slice(startIdx, endIdx).join("\n");
      }
    }

    if (!stepTheory) {
      stepTheory = "Подробное описание данного шага и процесса содержится во введении этапа выше.";
    }

    res.json({
      stageIntroduction,
      stepTheory
    });

  } catch (error: any) {
    console.error("Error in /api/get-theory:", error);
    res.status(500).json({ error: error.message || "Ошибка парсинга теории." });
  }
});

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
    const { stepId, userIdea, stepTitle, stepSubtitle, promptContent } = req.body;
    if (!userIdea || userIdea.trim() === "") {
      return res.status(400).json({ error: "Пожалуйста, опишите вашу идею продукта." });
    }

    const ai = getGeminiClient();

    const systemInstruction = "Вы — профессиональный и опытный ИИ-архитектор продуктов, продакт-менеджер и ведущий разработчик. Отвечайте на русском языке.";

    const prompt = `Мы проходим интерактивный курс по созданию ИИ-продуктов (вайб-кодинг с ИИ-ассистентами).
Текущая идея создаваемого продукта: "${userIdea}"

Текущий шаг обучения: "${stepTitle || stepId}"
Описание шага: "${stepSubtitle || ""}"

Далее приведён системный промпт для этого шага:
------------------------------------------
${promptContent || "Сделай подробную спецификацию и пошаговые рекомендации для проектирования."}
------------------------------------------

Пожалуйста, смоделируй подробный, экспертный и качественный ответ ИИ на этот промпт, полностью адаптированный под контекст идеи "${userIdea}".
Ответ должен быть структурированным (с красивым форматированием заголовков, списков в формате Markdown), реалистичным (как будто это пишет настоящий ИИ-разработчик при вайб-кодинге) и полностью готовым для демонстрации и копирования. Обязательно соблюдай формат документа, если он указан в промпте.`;

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
  // Serve the standalone offline assets statically for web distribution
  app.use("/standalone_offline", express.static(path.join(process.cwd(), "standalone_offline")));

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
