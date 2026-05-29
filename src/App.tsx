import React, { useState, useEffect, useRef } from "react";
import { 
  Menu, BookOpen, Terminal, ChevronRight, ChevronLeft,
  Copy, Check, Sparkles, Send, Lock, Shield, Activity, FileText, 
  CheckCircle2, Zap, Download, AlertTriangle, Info, Folder, 
  ArrowRight, CheckCircle, HelpCircle, Flame, Target, MessageSquareCode,
  ThumbsUp, RefreshCw, X, PlayCircle, Settings, ClipboardList, HelpCircle as HelpIcon
} from "lucide-react";
import { COURSE_STEPS } from "./data";
import { ChatMessage, CourseStep } from "./types";
import { getLocalTheory } from "./theoryParser";

function parseBold(text: string): string {
  if (!text) return "";
  return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold font-mono">$1</strong>');
}

function MarkdownRenderer({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/(```[\s\S]*?```)/g);
  return (
    <div className="space-y-3 font-mono text-[11px] leading-relaxed text-[#e2ede2]">
      {parts.map((part, index) => {
        if (part.startsWith("```")) {
          const lines = part.split("\n");
          const lang = lines[0].replace("```", "").trim() || "markdown";
          const code = lines.slice(1, lines.length - 1).join("\n");
          return (
            <div key={index} className="border border-white/10 rounded-lg overflow-hidden my-2 bg-black/40">
              <div className="bg-black/40 px-3 py-1.5 border-b border-white/5 flex justify-between items-center">
                <span className="text-[9px] font-mono font-bold text-[#00ff85] uppercase tracking-wider">{lang} block</span>
              </div>
              <pre className="p-3 font-mono text-[11px] leading-relaxed overflow-x-auto text-[#00ff85] custom-scrollbar">
                <code>{code}</code>
              </pre>
            </div>
          );
        } else {
          const lines = part.split("\n");
          return (
            <div key={index} className="space-y-1">
              {lines.map((line, lIdx) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={lIdx} className="h-1.5" />;
                if (trimmed.startsWith("# ")) {
                  return <h2 key={lIdx} className="text-xs font-extrabold text-[#00ff85] pt-2 border-b border-white/10 pb-0.5 font-mono uppercase tracking-wider">{trimmed.replace("# ", "")}</h2>;
                }
                if (trimmed.startsWith("## ")) {
                  return <h3 key={lIdx} className="text-xs font-bold text-white pt-1.5 font-mono uppercase tracking-wider">{trimmed.replace("## ", "")}</h3>;
                }
                if (trimmed.startsWith("### ")) {
                  return <h4 key={lIdx} className="text-[11px] font-bold text-[#00ff85] font-mono tracking-wider">{trimmed.replace("### ", "")}</h4>;
                }
                if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ") || trimmed.startsWith("— ")) {
                  const cleaned = trimmed.replace(/^[-*•—]\s+/, "");
                  return (
                    <div key={lIdx} className="flex gap-2 pl-3 select-text">
                      <span className="text-[#00ff85] shrink-0">•</span>
                      <span className="text-[#b9cbb9] font-mono text-[11px]" dangerouslySetInnerHTML={{ __html: parseBold(cleaned) }} />
                    </div>
                  );
                }
                return (
                  <p key={lIdx} className="text-[#b9cbb9] leading-relaxed select-text font-mono text-[11px]" dangerouslySetInnerHTML={{ __html: parseBold(line) }} />
                );
              })}
            </div>
          );
        }
      })}
    </div>
  );
}

export default function App() {
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  
  // Custom Project state for Interactive Simulation
  const [userIdea, setUserIdea] = useState<string>("Телеграм-бот для подбора персонализированных тренировок по бегу");
  const [stepSimulations, setStepSimulations] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  // User input blackboards for each separate step index
  const [blackboards, setBlackboards] = useState<Record<number, string>>({
    0: "",
    1: "Когда у меня сидячая работа, я как бегун-любитель хочу получать программу бега под мое самочувствие за 1 минуту, чтобы не тратить часы на Excel-таблицы.",
    2: "",
    3: "",
  });

  // Track selection for Step 3
  const [trackChoice, setTrackChoice] = useState<"external" | "internal" | "personal">("internal");

  // Clipboard feedbacks
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  // Course Progress checkmarks
  const [completedSteps, setCompletedSteps] = useState<number[]>([0]);

  // Collapsed Sidebar Navigation state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Selected stage category filter / grouping
  const [selectedStageNum, setSelectedStageNum] = useState<string>("0");

  // AI Coach drawer state
  const [isCoachOpen, setIsCoachOpen] = useState<boolean>(false);
  const [coachInput, setCoachInput] = useState<string>("");
  const [coachMessages, setCoachMessages] = useState<ChatMessage[]>([]);
  const [isCoachLoading, setIsCoachLoading] = useState<boolean>(false);
  const coachEndRef = useRef<HTMLDivElement>(null);

  // Workspace View tabs (Prompt vs Textbook Theory)
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"prompt" | "theory">("prompt");
  const [theoryData, setTheoryData] = useState<{ stageIntroduction: string; stepTheory: string } | null>(null);
  const [isTheoryLoading, setIsTheoryLoading] = useState<boolean>(false);

  const currentStep = COURSE_STEPS[currentStepIdx] || COURSE_STEPS[0];

  // Dynamically fetch theory textbook material when step or stage changes
  useEffect(() => {
    let active = true;
    const fetchTheory = async () => {
      setIsTheoryLoading(true);
      try {
        const response = await fetch("/api/get-theory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            stageNum: currentStep.stageNum,
            stepTitle: currentStep.title,
            stepSubtitle: currentStep.subtitle
          })
        });
        if (active) {
          if (response.ok) {
            const data = await response.json();
            setTheoryData(data);
          } else {
            // Fallback to local client-side parsing (helpful for static hosting/Netlify)
            const localData = getLocalTheory(currentStep.stageNum, currentStep.title);
            setTheoryData(localData);
          }
        }
      } catch (err) {
        console.error("Failed to fetch theory from server, falling back to client-side parsing:", err);
        if (active) {
          const localData = getLocalTheory(currentStep.stageNum, currentStep.title);
          setTheoryData(localData);
        }
      } finally {
        if (active) setIsTheoryLoading(false);
      }
    };

    if (currentStep) {
      fetchTheory();
    }

    return () => {
      active = false;
    };
  }, [currentStepIdx]);

  // Initialize messages if empty
  useEffect(() => {
    if (coachMessages.length === 0) {
      setCoachMessages([
        {
          role: "model",
          text: `Привет! Я твой персональный ИИ-наставник (AI Coach) по вайб-кодингу. Поздравляю с началом интерактивного практикума!
Сейчас мы активировали **ЭТАП 0: Постановка проблемы**.
Опиши свою идею ИИ-продукта в поле вверху страницы, выбери шаг и напиши мне, я с радостью проанализирую твой черновик, помогу составить JTBD, гайд CustDev или бриф!`
        }
      ]);
    }
  }, []);

  // Sync stage number filter based on step selected
  useEffect(() => {
    if (currentStep) {
      setSelectedStageNum(currentStep.stageNum);
    }
  }, [currentStepIdx]);

  // Scroll to bottom on new chat messages
  useEffect(() => {
    coachEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [coachMessages]);

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  // call dynamic server-side API to simulate LLM execution for this step
  const handleGenerateStepArtifact = async () => {
    if (!userIdea.trim()) {
      setSimulationError("Пожалуйста, опишите вашу проектируемую идею вверху страницы.");
      return;
    }
    
    setIsGenerating(true);
    setSimulationError(null);

    // Swap text if it is step 3 based on track choice
    let promptTextToUse = currentStep.promptContent || "";
    if (currentStep.id === "step_0_audience" && currentStep.promptsByTrack) {
      promptTextToUse = currentStep.promptsByTrack[trackChoice];
    }

    try {
      const response = await fetch("/api/generate-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          stepId: currentStep.id, 
          userIdea,
          stepTitle: currentStep.title,
          stepSubtitle: currentStep.subtitle,
          promptContent: promptTextToUse
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Не удалось сгенерировать ИИ симуляцию.");
      }

      setStepSimulations(prev => ({
        ...prev,
        [currentStep.id]: data.text
      }));
    } catch (err: any) {
      console.error(err);
      setSimulationError(err.message || "Ошибка подключения к серверу AI Studio.");
    } finally {
      setIsGenerating(false);
    }
  };

  // chat with coach
  const handleSendToCoach = async () => {
    if (!coachInput.trim()) return;

    const userMsg = coachInput;
    setCoachMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setCoachInput("");
    setIsCoachLoading(true);

    try {
      const response = await fetch("/api/chat-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Идея студента: "${userIdea}". Текущий шаг: "${currentStep.title}" (Этап ${currentStep.stageNum}). Черновик студента для этого шага: "${blackboards[currentStepIdx] || "Не заполнено"}" Вопрос/Комментарий: ${userMsg}` })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Ошибка соединения с ИИ-наставником.");
      }

      setCoachMessages(prev => [...prev, { role: "model", text: data.text }]);
    } catch (err: any) {
      console.error(err);
      setCoachMessages(prev => [
        ...prev, 
        { role: "model", text: `Не удалось связаться с Gemini. Убедитесь, что GEMINI_API_KEY добавлен в настройки проекта. Ошибка: ${err.message}` }
      ]);
    } finally {
      setIsCoachLoading(false);
    }
  };

  const toggleCheckStep = (idx: number) => {
    if (completedSteps.includes(idx)) {
      setCompletedSteps(prev => prev.filter(x => x !== idx));
    } else {
      setCompletedSteps(prev => [...prev, idx]);
    }
  };

  // Group steps by their stages to build the navigation hierarchy
  const stagesList = [
    { num: "0", name: "📋 Постановка проблемы", desc: "Сбор гипотез, CustDev и брифа", active: true },
    { num: "1", name: "💡 Докрутка идеи", desc: "Питч и фраза-визитка", active: false },
    { num: "2", name: "🔍 Глубокое исследование", desc: "Сканирование конкурентов и УТП", active: false },
    { num: "3", name: "📦 MVP состав", desc: "Бэклог, MoSCoW фильтр и метрики", active: false },
    { num: "4", name: "🛠 Проектирование", desc: "Сценарии, сущности и БД схема", active: false },
    { num: "5", name: "🎨 Визуальный прототип", desc: "Вёрстка экранов в v0 / Bolt / Cursor", active: false },
    { num: "6", name: "💅 Дизайн-система", desc: "Спецификация Style Guide и токенов", active: false },
    { num: "7", name: "📄 Мастер ТЗ", desc: "Итоговая спека разработки (PRD)", active: false },
    { num: "8", name: "🗺 Roadmap & Спринты", desc: "Декомпозиция на этапы и спринты", active: false },
    { num: "9", name: "💻 Разработка MVP", desc: "Чистая разработка, логирование и баги", active: false },
    { num: "10", name: "🛡 Ревью и безопасность", desc: "Security-аудит, PII и утечки", active: false },
    { num: "11", name: "🚀 Деплой на VPS", desc: "Docker, Nginx, Let's Encrypt, SSL", active: false },
    { num: "12", name: "👥 Бета и запуск", desc: "GTM маркетинг, CustDev, багтрекер", active: false },
    { num: "13", name: "📈 Развитие продукта", desc: "Retention воронка и продуктовые метрики", active: false }
  ];

  const getSyllabusProgress = () => {
    return Math.round((completedSteps.length / COURSE_STEPS.length) * 100);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#051424] text-[#d4e4fa] relative overflow-x-hidden select-none selection:bg-[#00ff85] selection:text-[#00210c] font-sans">
      
      {/* Ambient glowing filters */}
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[radial-gradient(circle_at_center,rgba(0,255,133,0.08)_0%,transparent_70%)] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[45%] h-[45%] bg-[radial-gradient(circle_at_center,rgba(0,140,255,0.05)_0%,transparent_70%)] pointer-events-none -z-10" />

      {/* Top Header AppBar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#051424]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-4 md:px-6 py-4 h-16">
        <div className="flex items-center gap-3">
          <button 
            id="toggle_sidebar_btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 -ml-2 rounded-lg hover:bg-white/5 active:scale-95 transition-transform text-[#00ff85]"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col">
            <h1 className="text-sm font-extrabold font-mono text-white tracking-wider uppercase flex items-center gap-2">
              <span>AI PRODUCT PRACTICUM</span>
              <span className="hidden sm:inline bg-[#00ff85]/10 border border-[#00ff85]/30 text-[#00ff85] text-[9px] px-2 py-0.5 rounded uppercase font-mono">
                14 ЭТАПОВ
              </span>
            </h1>
            <p className="text-[10px] text-gray-400 font-mono hidden sm:block">Интерактивный тренажер по вайб-кодингу на базе нового регламента</p>
          </div>
        </div>

        {/* Global Progress Indicator */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-6 text-right">
            <div>
              <div className="text-[10px] text-gray-400 font-mono">КЛИЕНТСКАЯ ТЕМА</div>
              <div className="text-[11px] text-[#00ff85] font-mono font-bold font-semibold truncate max-w-[280px]">
                {userIdea.length > 35 ? userIdea.substring(0, 35) + "..." : userIdea}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-mono">ВЫПОЛНЕНО ШАГОВ</div>
              <div className="text-[11px] text-white font-mono font-bold">
                {completedSteps.length} из {COURSE_STEPS.length} ({getSyllabusProgress()}%)
              </div>
            </div>
          </div>

          <div className="w-24 md:w-32 bg-white/5 rounded-full h-2 overflow-hidden border border-white/10 shrink-0">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-[#00ff85] shadow-[0_0_10px_rgba(0,255,133,0.3)] transition-all duration-500"
              style={{ width: `${getSyllabusProgress()}%` }}
            />
          </div>

          <button
            id="coach_trigger_btn"
            onClick={() => setIsCoachOpen(true)}
            className="flex items-center gap-2 bg-[#00ff85]/10 hover:bg-[#00ff85]/20 border border-[#00ff85]/40 text-[#00ff85] px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,255,133,0.05)] active:scale-95"
          >
            <MessageSquareCode className="w-4 h-4 animate-pulse" />
            <span className="hidden md:inline">ИИ-НАСТАВНИК</span>
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 flex pt-16 min-h-[calc(100vh-4rem)] relative items-stretch">
        
        {/* LEFT COLUMN: Stage list & Step tree */}
        <aside 
          id="sidebar_navigation"
          className={`shrink-0 border-r border-white/10 bg-[#06182c] transition-all duration-300 z-30 custom-scrollbar flex flex-col ${
            isSidebarOpen ? "w-[300px] opacity-100" : "w-0 overflow-hidden opacity-0 pointer-events-none"
          }`}
        >
          {/* Section: Stage Picker */}
          <div className="p-4 border-b border-white/5 bg-[#041221]">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#00ff85] font-bold block mb-2">
              Учебная программа:
            </span>
            <div className="text-xs text-[#b9cbb9] font-mono leading-relaxed bg-[#00ff85]/5 border border-[#00ff85]/10 rounded p-2.5">
              Вайб-кодинг разбит на 14 этапов (0–13). Начинай с ЭТАПА 0, набивай руку на постановке проблемы и CustDev!
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
            {stagesList.map((stage) => {
              const isSelected = selectedStageNum === stage.num;
              const stageSteps = COURSE_STEPS.filter(st => st.stageNum === stage.num);
              const completedFromStage = stageSteps.filter(st => completedSteps.includes(st.stepIdx));
              const isStageDone = stageSteps.length > 0 && completedFromStage.length === stageSteps.length;
              const isStage0 = stage.num === "0";

              return (
                <div 
                  key={stage.num} 
                  id={`stage_card_${stage.num}`}
                  className={`rounded-lg border p-2.5 transition-all cursor-pointer ${
                    isSelected 
                      ? "bg-[#09223c]/90 border-[#00ff85]/40 shadow-[0_0_15px_rgba(0,255,133,0.05)]" 
                      : "bg-[#051424]/40 border-white/5 hover:border-white/10"
                  }`}
                  onClick={() => {
                    setSelectedStageNum(stage.num);
                    const firstStep = COURSE_STEPS.find(st => st.stageNum === stage.num);
                    if (firstStep) {
                      setCurrentStepIdx(firstStep.stepIdx);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-xs font-bold ${isSelected ? "text-[#00ff85]" : "text-white"}`}>
                      {stage.name}
                    </span>
                    {isStageDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff85]" />
                    ) : isStage0 ? (
                      <span className="text-[8px] bg-amber-500/10 border border-amber-500/30 text-amber-500 font-mono px-1 py-0.5 rounded font-bold uppercase tracking-wider">
                        АКТИВЕН
                      </span>
                    ) : (
                      <span className="text-[8px] border border-white/15 text-gray-500 font-mono px-1 py-0.5 rounded uppercase">
                        {stageSteps.length} шг
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 leading-snug font-mono pl-3">{stage.desc}</p>
                  
                  {/* Step list expanded if selected */}
                  {isSelected && (
                    <div className="mt-3.5 pl-3 border-l border-white/10 space-y-2 pt-1">
                      {stageSteps.map((st) => {
                        const isStepSelected = currentStepIdx === st.stepIdx;
                        const isStepDone = completedSteps.includes(st.stepIdx);
                        return (
                          <div 
                            key={st.id}
                            className={`flex items-start gap-2 py-1 px-1.5 rounded transition-all text-left ${
                              isStepSelected 
                                ? "bg-[#00ff85]/10 text-white font-bold" 
                                : "text-gray-400 hover:text-white"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentStepIdx(st.stepIdx);
                            }}
                          >
                            <span className="mt-1 shrink-0">
                              {isStepDone ? (
                                <Check className="w-3 h-3 text-[#00ff85] stroke-[3]" />
                              ) : (
                                <div className={`w-1.5 h-1.5 rounded-full ${isStepSelected ? "bg-[#00ff85] animate-ping" : "bg-gray-600"}`} />
                              )}
                            </span>
                            <div className="text-[10px] font-mono leading-tight flex-1">
                              {st.title.replace(/^\d+\.\s*/, "")}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t border-white/10 bg-[#041221] text-center font-mono">
            <div className="text-[10px] text-gray-400">ВЫ КУРИРУЕТЕ ТАКЖЕ:</div>
            <a 
              href="https://docs.google.com/document/d/1EnpcFuncUolrCwsspXCKEmNknGKugLc1GUFBhdXx-NY/edit?usp=sharing"
              target="_blank"
              rel="referrer"
              className="mt-1 text-[10px] text-[#00ff85] hover:underline flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3 h-3" />
              <span>Google Doc Регламент 🔗</span>
            </a>
          </div>
        </aside>

        {/* CENTER COLUMN: Workspace, prompt, copy buttons, simulators & blackboard */}
        <main className="flex-1 min-w-0 bg-[#051424] p-4 md:p-6 flex flex-col space-y-6">

          {/* Section: Global Product Idea Setting banner */}
          <div className="bg-[#05172a] border border-[#00ff85]/20 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="bg-[#00ff85]/15 p-2 rounded-lg border border-[#00ff85]/20 shrink-0">
                <Target className="w-5 h-5 text-[#00ff85]" />
              </div>
              <div className="space-y-1 w-full">
                <label className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 block font-bold">
                  Проектируемая идея для адаптации ИИ-промптов:
                </label>
                <input 
                  id="user_idea_input"
                  type="text" 
                  value={userIdea}
                  onChange={(e) => setUserIdea(e.target.value)}
                  placeholder="Например: Самый удобный Telegram-бот поиска авиабилетов с прогнозом цен..."
                  className="w-full bg-black/40 border border-white/15 hover:border-white/20 focus:border-[#00ff85]/50 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 font-mono focus:outline-none transition-colors"
                />
              </div>
            </div>
            
            <div className="text-center sm:text-right shrink-0">
              <span className="text-[10px] uppercase font-mono text-gray-500 block">МЕТОДИКА ТРЕНАЖЕРА</span>
              <span className="text-[11px] text-white font-mono bg-white/5 border border-white/10 px-2.5 py-1 rounded-md mt-1 inline-block">
                Copy → Paste к LLM в IDE → Save
              </span>
            </div>
          </div>

          {/* Step Detail Card */}
          <div className="glass-card rounded-xl border border-white/10 overflow-hidden flex flex-col">
            
            {/* Slide Header area */}
            <div className="bg-[#061c31]/90 px-5 py-4 border-b border-white/10 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-[#00ff85]/15 border border-[#00ff85]/30 text-[#00ff85] font-mono px-2 py-0.5 rounded font-extrabold font-bold uppercase tracking-wider">
                    {currentStep.stepNumLabel}
                  </span>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    currentStep.badgeType === "must" 
                      ? "bg-red-500/10 border-red-500/20 text-red-400" 
                      : currentStep.badgeType === "active" 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                  }`}>
                    {currentStep.badgeText}
                  </span>
                </div>
                <h2 className="text-base font-bold text-white tracking-tight">{currentStep.title}</h2>
                <p className="text-xs text-gray-300 inline-block font-mono leading-relaxed">{currentStep.subtitle}</p>
              </div>

              {/* Slide Pagination & Checklist complete trigger */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  id="prev_step_btn"
                  onClick={() => setCurrentStepIdx(prev => Math.max(0, prev - 1))}
                  disabled={currentStepIdx === 0}
                  className="p-2 rounded bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>

                <button
                  id="step_checkbox_btn"
                  onClick={() => toggleCheckStep(currentStepIdx)}
                  className={`flex items-center gap-2 font-mono text-[11px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-lg border transition-all active:scale-95 ${
                    completedSteps.includes(currentStepIdx)
                      ? "bg-emerald-500/15 border-[#00ff85]/50 text-[#00ff85] shadow-[0_0_10px_rgba(0,255,133,0.1)]"
                      : "bg-black/20 border-white/10 text-gray-400 hover:border-white/20"
                  }`}
                >
                  <CheckCircle className={`w-3.5 h-3.5 ${completedSteps.includes(currentStepIdx) ? "text-[#00ff85]" : "text-gray-500"}`} />
                  <span>{completedSteps.includes(currentStepIdx) ? "Выполнено" : "Отметить выполненным"}</span>
                </button>

                <button
                  id="next_step_btn"
                  onClick={() => setCurrentStepIdx(prev => Math.min(COURSE_STEPS.length - 1, prev + 1))}
                  disabled={currentStepIdx === COURSE_STEPS.length - 1}
                  className="p-2 rounded bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* MAIN WORKSPACE BODY GRID: Left prompt area, Right Blackboard drafting notes */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-0 border-b border-white/10">

              {/* Workspace column left: Prompt template & instructions (Col: 7) */}
              <div className="xl:col-span-7 p-5 flex flex-col space-y-4 border-b xl:border-b-0 xl:border-r border-white/10">
                
                {/* View Tabs Selector */}
                <div className="flex border-b border-white/10 pb-0.5 mb-1 gap-2">
                  <button
                    onClick={() => setActiveWorkspaceTab("prompt")}
                    className={`font-mono text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 border-b-2 transition-all flex items-center gap-1.5 ${
                      activeWorkspaceTab === "prompt"
                        ? "border-[#00ff85] text-[#00ff85]"
                        : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    <span>📋 Промпт для ИИ</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveWorkspaceTab("theory")}
                    className={`font-mono text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 border-b-2 transition-all flex items-center gap-2 ${
                      activeWorkspaceTab === "theory"
                        ? "border-[#00ff85] text-[#00ff85]"
                        : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    <span>📚 Теория и Процессы</span>
                    {isTheoryLoading && <RefreshCw className="w-3 h-3 animate-spin text-[#00ff85]" />}
                  </button>
                </div>

                {activeWorkspaceTab === "prompt" ? (
                  <>
                    {/* Specific option toggles if Step 3 (Audience segmentation) */}
                    {currentStep.id === "step_0_audience" && (
                      <div className="bg-black/30 border border-white/10 rounded-lg p-3 space-y-2">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-[#00ff85] block font-bold">
                          Выберите Трек / Сегмент Продукта:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setTrackChoice("external")}
                            className={`font-mono text-[10px] font-bold uppercase tracking-wider py-1.5 rounded transition-all border ${
                              trackChoice === "external"
                                ? "bg-[#00ff85]/15 border-[#00ff85]/40 text-[#00ff85]"
                                : "bg-black/20 border-white/5 text-gray-400 hover:text-white"
                            }`}
                          >
                            A • Внешний
                          </button>
                          <button
                            onClick={() => setTrackChoice("internal")}
                            className={`font-mono text-[10px] font-bold uppercase tracking-wider py-1.5 rounded transition-all border ${
                              trackChoice === "internal"
                                ? "bg-[#00ff85]/15 border-[#00ff85]/40 text-[#00ff85]"
                                : "bg-black/20 border-white/5 text-gray-400 hover:text-white"
                            }`}
                          >
                            B • Внутренний
                          </button>
                          <button
                            onClick={() => setTrackChoice("personal")}
                            className={`font-mono text-[10px] font-bold uppercase tracking-wider py-1.5 rounded transition-all border ${
                              trackChoice === "personal"
                                ? "bg-[#00ff85]/15 border-[#00ff85]/40 text-[#00ff85]"
                                : "bg-black/20 border-white/5 text-gray-400 hover:text-white"
                            }`}
                          >
                            C • Личный
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Prompt File Name breadcrumb */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-[#00ff85]" />
                        <span className="font-mono text-xs font-bold text-white tracking-widest uppercase">
                          {currentStep.promptTitle || "PROMPT.md"}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">ФОРМАТ: MARKDOWN промпт</span>
                    </div>

                    {/* Visual Prompt Board (SmartQuotes wrapper with exact Smart Quote symbols) */}
                    <div className="relative bg-black/60 rounded-xl p-4 border border-white/10 shrink-0 select-text max-h-[380px] overflow-y-auto custom-scrollbar font-mono text-[#00ff85] text-xs leading-relaxed">
                      <span className="absolute top-2 left-2 text-white/10 text-3xl font-serif">“</span>
                      <div className="pl-4 pr-2 whitespace-pre-wrap py-2 select-text font-mono text-[11px]">
                        {(() => {
                          let promptBody = currentStep.promptContent || "";
                          if (currentStep.id === "step_0_audience" && currentStep.promptsByTrack) {
                            promptBody = currentStep.promptsByTrack[trackChoice];
                          }
                          
                          // Adapt formula words dynamically if present
                          if (userIdea) {
                            promptBody = promptBody.replace(
                              /«\(впиши свою формулировку проблемы в поле слева на этом слайде\)»/g,
                              `«${blackboards[1] || userIdea}»`
                            );
                            promptBody = promptBody.replace(/\[внутренний продукт\]/g, `[${userIdea}]`);
                            promptBody = promptBody.replace(/\[внутренний\]/g, `[${userIdea}]`);
                            promptBody = promptBody.replace(/\[внешний продукт\]/g, `[${userIdea}]`);
                            promptBody = promptBody.replace(/\[внешний\]/g, `[${userIdea}]`);
                            promptBody = promptBody.replace(/\[личный продукт\]/g, `[${userIdea}]`);
                            promptBody = promptBody.replace(/\[личный\]/g, `[${userIdea}]`);
                          }
                          return promptBody;
                        })()}
                      </div>
                      <span className="absolute bottom-2 right-2 text-white/10 text-3xl font-serif">”</span>
                    </div>

                    {/* Action panel underneath prompt content */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        id="copy_prompt_btn"
                        onClick={() => {
                          let promptBody = currentStep.promptContent || "";
                          if (currentStep.id === "step_0_audience" && currentStep.promptsByTrack) {
                            promptBody = currentStep.promptsByTrack[trackChoice];
                          }
                          if (userIdea) {
                            promptBody = promptBody.replace(
                              /«\(впиши свою формулировку проблемы в поле слева на этом слайде\)»/g,
                              `«${blackboards[1] || userIdea}»`
                            );
                            promptBody = promptBody.replace(/\[внутренний продукт\]/g, `[${userIdea}]`);
                            promptBody = promptBody.replace(/\[внутренний\]/g, `[${userIdea}]`);
                            promptBody = promptBody.replace(/\[внешний продукт\]/g, `[${userIdea}]`);
                            promptBody = promptBody.replace(/\[внешний\]/g, `[${userIdea}]`);
                            promptBody = promptBody.replace(/\[личный продукт\]/g, `[${userIdea}]`);
                            promptBody = promptBody.replace(/\[личный\]/g, `[${userIdea}]`);
                          }
                          // Format precisely as Markdown format
                          const fullMarkdownPrompt = `**ПРОМПТ:**\n\n\`\`\`\n${promptBody}\n\`\`\``;
                          handleCopyText(fullMarkdownPrompt, currentStep.id);
                        }}
                        className="flex-1 flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-[#00ff85] hover:brightness-110 active:scale-[0.98] text-black px-4 py-2.5 rounded-lg text-xs font-mono font-extrabold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(0,255,133,0.15)] shrink-0"
                      >
                        {copiedStates[currentStep.id] ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>СКОПИРОВАНО!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>СКОПИРОВАТЬ ПРОМПТ В MD</span>
                          </>
                        )}
                      </button>

                      <button
                        id="simulate_btn"
                        onClick={handleGenerateStepArtifact}
                        disabled={isGenerating}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#051424]/90 border border-white/10 hover:border-[#00ff85]/40 text-white disabled:opacity-40 disabled:pointer-events-none px-4 py-2.5 rounded-lg text-xs font-mono tracking-widest font-extrabold uppercase transition-all"
                      >
                        <Sparkles className={`w-4 h-4 text-[#00ff85] ${isGenerating ? "animate-spin" : ""}`} />
                        <span>{isGenerating ? "ИИ-СИМУЛЯЦИЯ ИДЕТ..." : "ЗАПУСТИТЬ ИИ-СИМУЛЯЦИЮ"}</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col space-y-4 h-full">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="font-mono text-xs font-bold text-gray-300 uppercase tracking-widest">
                        📚 Академический Учебник курса
                      </span>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                        ЭТАП {currentStep.stageNum} • {currentStep.stageName}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[380px] custom-scrollbar space-y-5 pr-2">
                      {isTheoryLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 space-y-3">
                          <RefreshCw className="w-6 h-6 text-[#00ff85] animate-spin" />
                          <p className="font-mono text-xs text-gray-400">Парсинг теоретических материалов из doc-content.txt...</p>
                        </div>
                      ) : theoryData ? (
                        <div className="space-y-6">
                          {theoryData.stageIntroduction && (
                            <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-3">
                              <h3 className="text-xs font-extrabold text-[#00ff85] uppercase tracking-wider font-mono flex items-center gap-2 border-b border-white/10 pb-1.5">
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Общая теория этапа</span>
                              </h3>
                              <MarkdownRenderer text={theoryData.stageIntroduction} />
                            </div>
                          )}

                          {theoryData.stepTheory && (
                            <div className="p-4 bg-[#041221]/80 border border-[#00ff85]/10 rounded-xl space-y-3">
                              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono flex items-center gap-2 border-b border-white/5 pb-1.5">
                                <Zap className="w-3.5 h-3.5 text-[#00ff85]" />
                                <span>Методика и Процесс шага</span>
                              </h3>
                              <MarkdownRenderer text={theoryData.stepTheory} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-5 bg-black/20 rounded-lg text-center font-mono text-xs text-gray-500">
                          Теория по текущему шагу не была загружена или временно недоступна.
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => setActiveWorkspaceTab("prompt")}
                        className="w-full flex items-center justify-center gap-2 bg-[#041221] hover:bg-[#061c31] text-[#00ff85] border border-[#00ff85]/20 hover:border-[#00ff85]/50 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all"
                      >
                        <span>перейти к копированию промпта</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Workspace column right: Drafting blackboard (Col: 5) */}
              <div className="xl:col-span-5 p-5 bg-[#041221]/50 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-mono font-bold text-gray-300 uppercase tracking-widest">
                      Черновик / Заметки шага:
                    </span>
                  </div>
                  <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-gray-500 font-mono">AB-ТЕСТИРОВАНИЕ</span>
                </div>

                <div className="flex-1 flex flex-col min-h-[220px]">
                  <textarea
                    id="draft_textarea"
                    value={blackboards[currentStepIdx] || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBlackboards(prev => ({ ...prev, [currentStepIdx]: val }));
                    }}
                    placeholder={
                      currentStepIdx === 1 
                        ? "Контекст: Вечер после работы и легкий бег\nМоя черновая проблема: " 
                        : "Впишите сюда свои ответы на уточняющие вопросы ИИ, транскрипты, черновики Jobs-To-Be-Done или свои личные продуктовые заметки. Обучение автосохраняется в памяти браузера..."
                    }
                    className="w-full flex-1 bg-black/40 border border-white/10 hover:border-white/15 focus:border-[#00ff85]/40 text-[11px] text-white p-3.5 rounded-lg font-mono focus:outline-none focus:ring-0 custom-scrollbar resize-none font-medium leading-relaxed"
                  />
                </div>

                <div className="bg-[#051424]/80 border border-white/10 rounded-lg p-3 text-[10px] leading-normal font-mono text-gray-400">
                  <span className="text-[#00ff85] font-bold block mb-1">◆ РЕКОМЕНДАЦИЯ ЭКСПЕРТА:</span>
                  Скопируйте промпт слева во внешнюю языковую модель (например Claude/Cursor) внутри папки вашего проекта и вставьте итоговый полученный отчет в этот черновик.
                </div>
              </div>

            </div>

            {/* LOWER AREA: AI Live simulated product artifact view */}
            <div className="p-5 bg-black/40">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <Terminal className="w-4 h-4 text-[#00ff85]" />
                  <span className="font-mono text-xs font-extrabold text-[#00ff85] tracking-widest uppercase">
                    Интерактивный Терминал-Просмотрщик Результатов Симуляции
                  </span>
                </div>
                
                {stepSimulations[currentStep.id] && (
                  <button
                    onClick={() => {
                      const text = stepSimulations[currentStep.id];
                      handleCopyText(text, `${currentStep.id}_sim`);
                    }}
                    className="text-[10px] font-mono text-gray-400 hover:text-white flex items-center gap-1.5"
                  >
                    {copiedStates[`${currentStep.id}_sim`] ? (
                      <>
                        <Check className="w-3 h-3 text-[#00ff85]" />
                        <span className="text-[#00ff85]">В буфере</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Копировать результат симуляции</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {simulationError ? (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs font-mono flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <div>
                    <h4 className="font-bold uppercase tracking-wider">Ошибка выполнения симуляции</h4>
                    <p className="mt-1 text-gray-300">{simulationError}</p>
                  </div>
                </div>
              ) : isGenerating ? (
                <div className="bg-black/30 border border-white/5 rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="w-8 h-8 text-[#00ff85] animate-spin" />
                  <p className="text-xs text-gray-400 font-mono tracking-widest animate-pulse uppercase">
                    Загрузка ИИ-симуляции: генерируем развернутый ответ на базе идеи "{userIdea}"...
                  </p>
                </div>
              ) : stepSimulations[currentStep.id] ? (
                <div className="bg-black/40 border border-white/10 rounded-xl p-4 md:p-5 text-xs text-gray-100 max-h-[500px] overflow-y-auto custom-scrollbar select-text selection:bg-[#00ff85] font-mono whitespace-pre-wrap">
                  <MarkdownRenderer text={stepSimulations[currentStep.id]} />
                </div>
              ) : (
                <div className="bg-black/20 border border-dashed border-white/10 rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-3">
                  <PlayCircle className="w-10 h-10 text-gray-600" />
                  <p className="text-xs text-gray-400 font-mono max-w-md">
                    Нажмите кнопку <strong className="text-white">«ЗАПУСТИТЬ ИИ-СИМУЛЯЦИЮ»</strong> выше, чтобы сэмулировать результат выполнения этого промпта моделью Gemini прямо внутри тренажёра.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Section: Extra info warning / guidelines for Stage 0 validation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#091b2c] border border-white/10 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-[#00ff85] font-mono uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>⚠ ПРАВИЛО КОРНЕЙ ВЕТО (ЭТАП 0. ШАГ 1)</span>
              </h4>
              <p className="text-[10px] leading-relaxed text-gray-400 font-mono">
                Для избежания хаоса при вайб-кодинге файлы CLAUDE.md и AGENTS.md должны быть идентичны и храниться строго в корне проекта. Категорически запрещено редактировать или создавать файлы без Ок-подтверждения в чате!
              </p>
            </div>

            <div className="bg-[#091b2c] border border-white/10 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-[#00ff85] font-mono uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <span>◆ БЕСШОВНЫЕ ПРАКТИКИ JTBD</span>
              </h4>
              <p className="text-[10px] leading-relaxed text-gray-400 font-mono">
                Не смешивайте боли с решениями. Слово "сервис" или "телеграм-бот" в формулировке проблемы должно быть исключено. Сосредоточьтесь на мотивации и болях живой аудитории.
              </p>
            </div>
          </div>
        </main>

        {/* RIGHT COLUMN DRAWER: AI Coach Sidebar panel */}
        {isCoachOpen && (
          <aside 
            id="coach_drawer"
            className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-[#061c33] border-l border-white/15 flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.5)]"
          >
            {/* Coach Header */}
            <div className="bg-[#041223] px-4 py-4 border-b border-white/10 flex justify-between items-center h-16">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded bg-[#00ff85]/20 flex items-center justify-center text-[#00ff85] font-mono text-[10px] font-bold">PM</div>
                <div>
                  <h3 className="text-xs font-extrabold text-white font-mono tracking-wider uppercase">ИИ-Наставник (AI Coach)</h3>
                  <p className="text-[9px] text-[#00ff85] font-mono">ЭКСПЕРТ ПРОДУКТОВОГО ВАЙБ-КОДИНГА</p>
                </div>
              </div>
              <button 
                id="close_coach_btn"
                onClick={() => setIsCoachOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white active:scale-95 transition-transform"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat message space */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar select-text">
              {coachMessages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed font-mono ${
                    msg.role === "user" 
                      ? "bg-[#00ff85]/10 border border-[#00ff85]/30 text-white" 
                      : "bg-[#041425] border border-white/5 text-[#d4e4fa]"
                  }`}>
                    {msg.role === "model" ? (
                      <MarkdownRenderer text={msg.text} />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                </div>
              ))}
              {isCoachLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#041425] border border-white/5 rounded-xl px-4 py-3 text-xs font-mono text-[#00ff85] flex items-center gap-2 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>ИИ-Наставник думает...</span>
                  </div>
                </div>
              )}
              <div ref={coachEndRef} />
            </div>

            {/* Chat Input box */}
            <div className="p-4 border-t border-white/10 bg-[#041223] flex gap-2">
              <input 
                id="coach_chat_input"
                type="text"
                value={coachInput}
                onChange={(e) => setCoachInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendToCoach();
                }}
                placeholder="Задайте вопрос по CustDev, JTBD или брифу..."
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 font-mono focus:outline-none focus:border-[#00ff85]/50 transition-colors"
              />
              <button
                id="send_coach_msg_btn"
                onClick={handleSendToCoach}
                disabled={isCoachLoading}
                className="p-2 rounded-lg bg-emerald-500 text-black hover:bg-[#00ff85] active:scale-95 transition-transform"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </aside>
        )}

      </div>

    </div>
  );
}
