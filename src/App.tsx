import React, { useState, useEffect, useRef } from "react";
import { 
  Menu, BookOpen, Terminal, TrendingUp, ChevronLeft, ChevronRight, 
  Copy, Check, Sparkles, Send, Lock, Shield, Activity, FileText, 
  CheckCircle2, Zap, Award, Download, AlertTriangle, Info, Folder, 
  ArrowRight, CheckCircle, HelpCircle, Flame, Target, MessageSquareCode,
  ThumbsUp, RefreshCw, X, PlayCircle
} from "lucide-react";
import { COURSE_STEPS } from "./data";
import { ChatMessage, CourseStep } from "./types";

function parseBold(text: string): string {
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
          const lang = lines[0].replace("```", "").trim() || "prompt";
          const code = lines.slice(1, lines.length - 1).join("\n");
          return (
            <div key={index} className="border border-white/10 rounded-lg overflow-hidden my-2">
              <div className="bg-black/40 px-3 py-1 border-b border-white/5 flex justify-between items-center">
                <span className="text-[9px] font-mono font-bold text-[#00ff85] uppercase tracking-wider">{lang} block</span>
              </div>
              <pre className="p-3 bg-black/60 font-mono text-[11px] leading-relaxed overflow-x-auto text-[#00ff85] custom-scrollbar">
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
  const [activeTab, setActiveTab] = useState<"study" | "prompts" | "progress">("study");
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  
  // Custom Project state for Interactive Simulation
  const [userIdea, setUserIdea] = useState<string>("Telegram-бот для подбора персонализированных тренировок с помощью ИИ");
  const [stepSimulations, setStepSimulations] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  // Clipboard feedbacks
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  // Course Progress checkboxes/states
  const [completedSteps, setCompletedSteps] = useState<number[]>([0]);

  // AI Coach Sidebar State
  const [isCoachOpen, setIsCoachOpen] = useState<boolean>(false);
  const [coachInput, setCoachInput] = useState<string>("");
  const [coachMessages, setCoachMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      text: "Привет! Я твой персональный ИИ-наставник (AI Coach). Я помогу тебе пройти все этапы проектирования твоего ИИ-продукта. Опиши свою идею в верхнем поле или спроси меня любой профессиональный совет!"
    }
  ]);
  const [isCoachLoading, setIsCoachLoading] = useState<boolean>(false);
  const coachEndRef = useRef<HTMLDivElement>(null);

  // Stage 0 Product Type Selection
  const [selectedProductType, setSelectedProductType] = useState<"A" | "B" | "C">("A");

  // Step indicator constants
  const currentStep = COURSE_STEPS[currentStepIdx];

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

  // call server-side gemini api to simulate step artifact
  const handleGenerateStepArtifact = async (stepId: string) => {
    if (!userIdea.trim()) {
      setSimulationError("Пожалуйста, опишите идею ИИ-продукта.");
      return;
    }
    
    setIsGenerating(true);
    setSimulationError(null);

    try {
      const response = await fetch("/api/generate-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId, userIdea })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Не удалось сгенерировать симуляцию.");
      }

      setStepSimulations(prev => ({
        ...prev,
        [stepId]: data.text
      }));
    } catch (err: any) {
      console.error(err);
      setSimulationError(err.message || "Ошибка подключения к серверу AI Studio.");
    } finally {
      setIsGenerating(false);
    }
  };

  // call server-side gemini api to chat with coach
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
        body: JSON.stringify({ message: `Относительно моей идеи: "${userIdea}". Вопрос: ${userMsg}` })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Ошибка ИИ-наставника.");
      }

      setCoachMessages(prev => [...prev, { role: "model", text: data.text }]);
    } catch (err: any) {
      console.error(err);
      setCoachMessages(prev => [
        ...prev, 
        { role: "model", text: `Извините, не удалось связаться с модулем Gemini CPU. Ошибка: ${err.message || "Задайте секрет GEMINI_API_KEY в панели Settings > Secrets"}` }
      ]);
    } finally {
      setIsCoachLoading(false);
    }
  };

  const markStepComplete = (idx: number) => {
    if (!completedSteps.includes(idx)) {
      setCompletedSteps(prev => [...prev, idx]);
    }
  };

  const handleNextStep = () => {
    markStepComplete(currentStepIdx);
    if (currentStepIdx < COURSE_STEPS.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setActiveTab("progress");
    }
  };

  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getProgressPercentage = () => {
    return Math.round((completedSteps.length / COURSE_STEPS.length) * 100);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#051424] text-[#d4e4fa] relative overflow-x-hidden selection:bg-[#00ff85] selection:text-[#00210c] font-sans pb-24 md:pb-12">
      {/* Ambient background glows */}
      <div className="fixed top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[radial-gradient(circle_at_center,rgba(0,255,133,0.12)_0%,transparent_70%)] pointer-events-none -z-10"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[radial-gradient(circle_at_center,rgba(0,255,133,0.06)_0%,transparent_70%)] pointer-events-none -z-10"></div>

      {/* Top AppBar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#051424]/80 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-6 py-4 h-16">
        <div className="flex items-center gap-3">
          <Menu className="w-5 h-5 text-[#00ff85] cursor-pointer hover:scale-105 active:scale-95 transition-transform" />
          <span className="font-mono text-xs font-bold text-[#00ff85] tracking-widest uppercase bg-[#00ff85]/10 px-2.5 py-1 rounded border border-[#00ff85]/20">
            {currentStepIdx + 1} / {COURSE_STEPS.length} • {getProgressPercentage()}% ПРГРЕСС
          </span>
        </div>

        {/* Desktop Tabs */}
        <nav className="hidden md:flex items-center gap-6">
          <button 
            onClick={() => setActiveTab("study")} 
            className={`font-mono text-xs font-bold tracking-widest uppercase transition-colors px-3 py-1.5 rounded ${activeTab === "study" ? "text-[#00ff85] bg-[#00ff85]/10 border border-[#00ff85]/35 shadow-[0_0_15px_rgba(0,255,133,0.15)]" : "text-[#b9cbb9] hover:text-white"}`}
          >
            Обучение
          </button>
          <button 
            onClick={() => setActiveTab("prompts")} 
            className={`font-mono text-xs font-bold tracking-widest uppercase transition-colors px-3 py-1.5 rounded ${activeTab === "prompts" ? "text-[#00ff85] bg-[#00ff85]/10 border border-[#00ff85]/35 shadow-[0_0_15px_rgba(0,255,133,0.15)]" : "text-[#b9cbb9] hover:text-white"}`}
          >
            Промпты
          </button>
          <button 
            onClick={() => { setActiveTab("progress"); markStepComplete(currentStepIdx); }} 
            className={`font-mono text-xs font-bold tracking-widest uppercase transition-colors px-3 py-1.5 rounded ${activeTab === "progress" ? "text-[#00ff85] bg-[#00ff85]/10 border border-[#00ff85]/35 shadow-[0_0_15px_rgba(0,255,133,0.15)]" : "text-[#b9cbb9] hover:text-white"}`}
          >
            Прогресс
          </button>
        </nav>

        {/* Global Reset */}
        <button 
          onClick={() => { setCurrentStepIdx(0); setActiveTab("study"); }}
          className="text-xs font-mono font-bold text-[#00ff85] border border-[#00ff85]/30 px-3 py-1 rounded hover:bg-white/5 transition-all active:scale-95 uppercase tracking-wider"
        >
          ГЛАВНАЯ
        </button>
      </header>

      {/* Sticky Custom Project Input Banner */}
      <div className="w-full mt-16 bg-[#0c1a29]/90 border-b border-[#00ff85]/15 px-4 py-3 sticky top-16 z-30 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-[#00ff85] whitespace-nowrap">
            <Sparkles className="w-4 h-4 text-[#00ff85] animate-pulse" />
            <span>ПРОЕКТИРУЕМАЯ ИДЕЯ:</span>
          </div>
          <input 
            type="text" 
            value={userIdea}
            onChange={(e) => setUserIdea(e.target.value)}
            placeholder="Опишите в 1 предложении идею ИИ-продукта для симуляции..." 
            className="flex-grow bg-[#051424]/90 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#00ff85] transition-colors"
          />
          <button 
            onClick={() => setIsCoachOpen(true)}
            className="px-4 py-1.5 rounded bg-[#00ff85]/10 border border-[#00ff85]/30 text-[#00ff85] text-xs font-mono font-bold hover:bg-[#00ff85]/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <MessageSquareCode className="w-3.5 h-3.5" />
            ИИ-НАСТАВНИК
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-8 relative">
        
        {/* Error notification for simulation */}
        {simulationError && (
          <div className="mb-6 p-4 rounded bg-red-950/40 border border-red-500/30 text-red-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Внимание!</p>
              <p className="text-xs text-red-300">{simulationError}</p>
              <p className="text-[10px] text-red-400 mt-2">
                Для полноценной генерации убедитесь, что в секретах AI Studio прописан <code className="bg-black/30 px-1 py-0.5 rounded text-[#00ff85]">GEMINI_API_KEY</code>.
              </p>
            </div>
          </div>
        )}

        {/* STUDY TAB */}
        {activeTab === "study" && (
          <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
            
            {/* Step Banner Top */}
            <div className="flex flex-wrap gap-2 items-center text-xs">
              <span className="px-3 py-1 rounded bg-[#0d1c2d] border border-[#00ff85] text-[#00ff85] font-mono">
                {currentStep.stageName} {currentStep.stageNum}
              </span>
              <span className={`px-3 py-1 rounded font-mono flex items-center gap-1.5 ${
                currentStep.badgeType === "must" ? "bg-[#00ff85]/10 border border-[#00ff85] text-[#00ff85]" :
                currentStep.badgeType === "active" ? "bg-[#00ff85]/10 border border-white/20 text-[#00ff85] animate-pulse" :
                "bg-white/5 border border-white/10 text-[#b9cbb9]"
              }`}>
                {currentStep.badgeType === "must" && <span className="w-1.5 h-1.5 rounded-full bg-[#00ff85] shadow-[0_0_8px_#00ff85]"></span>}
                {currentStep.badgeText}
              </span>
            </div>

            {/* Title / Subtext */}
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {currentStepIdx === 0 ? "Постановка " : ""}
                <span className="text-[#00ff85] neon-glow">
                  {currentStep.title}
                </span>
              </h1>
              <p className="text-base md:text-lg text-[#b9cbb9] max-w-2xl leading-relaxed">
                {currentStep.subtitle}
              </p>
            </div>

            {/* SCREEN-SPECIFIC RENDERERS */}

            {/* SCREEN 1: STEP idx 0 (Обзор курса Постановка проблемы) */}
            {currentStepIdx === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div 
                  onClick={() => setCurrentStepIdx(3)}
                  className="glass-card active-border p-6 rounded-xl space-y-3 cursor-pointer group"
                >
                  <Terminal className="w-8 h-8 text-[#00ff85]" />
                  <h3 className="text-xl font-bold text-white group-hover:text-[#00ff85] transition-colors">Анализ рынка</h3>
                  <p className="text-sm text-[#b9cbb9]">Выявление болевых точек рынка и формулировка AI-возможностей.</p>
                  <div className="text-xs font-mono text-[#00ff85] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>ПЕРЕЙТИ К ШАГУ 2-5</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>

                <div 
                  onClick={() => setCurrentStepIdx(6)}
                  className="glass-card p-6 rounded-xl space-y-3 cursor-pointer group"
                >
                  <Award className="w-8 h-8 text-[#00ff85]" />
                  <h3 className="text-xl font-bold text-white group-hover:text-[#00ff85] transition-colors">Гипотезы продукта</h3>
                  <p className="text-sm text-[#b9cbb9]">Формулирование ценности продукта и составление финального брифа.</p>
                  <div className="text-xs font-mono text-[#00ff85] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>ПЕРЕЙТИ К ШАГУ 11</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 2: STEP idx 1 (80% провалов теория) */}
            {currentStepIdx === 1 && (
              <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6 items-stretch">
                  {/* Failure card */}
                  <div className="glass-card p-6 rounded-xl border border-white/10 flex flex-col gap-4 group transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <span className="border border-white/20 text-[#b9cbb9] px-3 py-1 rounded-full font-mono text-[10px] tracking-wider uppercase">БЕЗ ЭТАПА 0</span>
                      <AlertTriangle className="w-5 h-5 text-red-400 opacity-60 group-hover:rotate-12 transition-transform" />
                    </div>
                    <div>
                      <h3 className="text-lg font-mono font-bold text-white flex flex-wrap items-center gap-2">
                        Идея <ArrowRight className="w-3 h-3 text-[#b9cbb9]" /> код <ArrowRight className="w-3 h-3 text-[#b9cbb9]" /> <span className="text-red-400">никому не нужно</span>
                      </h3>
                    </div>
                    <div className="bg-[#051424]/40 p-4 rounded-lg border border-white/5 mt-auto">
                      <p className="text-xs text-[#b9cbb9] leading-relaxed">
                        Потрачены недели и месяцы. Продукт работает технически, но не нужен ни одному реальному человеку. Возврат на старт — неизбежен.
                      </p>
                    </div>
                  </div>

                  {/* Success card */}
                  <div className="glass-card p-6 rounded-xl border border-[#00ff85]/30 ring-1 ring-[#00ff85]/10 flex flex-col gap-4 group relative overflow-hidden transition-all duration-350 hover:shadow-[0_0_30px_rgba(0,255,133,0.15)]">
                    <div className="absolute top-[-10px] right-[-10px] w-24 h-24 bg-[#00ff85]/5 rounded-full blur-2xl"></div>
                    <div className="flex items-center justify-between relative z-10">
                      <span className="border border-[#00ff85]/40 text-[#00ff85] px-3 py-1 rounded-full font-mono text-[10px] tracking-wider uppercase bg-[#00ff85]/10">С ЭТАПОМ 0</span>
                      <CheckCircle2 className="w-5 h-5 text-[#00ff85]" />
                    </div>
                    <div className="mt-2 relative z-10">
                      <h3 className="text-lg font-mono font-bold text-[#00ff85] flex flex-wrap items-center gap-2">
                        Проблема <ArrowRight className="w-3 h-3 text-[#00ff85]" /> пользователи <ArrowRight className="w-3 h-3 text-[#00ff85]" /> идея <ArrowRight className="w-3 h-3 text-[#00ff85]" /> код
                      </h3>
                    </div>
                    <div className="bg-[#00ff85]/5 p-4 rounded-lg border border-[#00ff85]/20 mt-auto relative z-10">
                      <p className="text-xs text-white leading-relaxed">
                        Сначала убеждаемся, что проблема реальна. Только потом — в код. Переделывать приходится меньше, шансы попасть в цель — кратно выше.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Featured Illustration image */}
                <div className="w-full mt-6">
                  <div className="glass-card rounded-xl overflow-hidden border border-white/10 aspect-[21/9] relative group">
                    <img 
                      alt="Архитектура реальности" 
                      className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-70 transition-all duration-1000"
                      referrerPolicy="no-referrer"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDiRKOeffDPDv93QIhgCkNOtP4fjRrQl25qsYwR7OGAr2JKnQh31JkieKgSG_bDPWQSoscuZvrGmoHPg7SjaX7PGHdiS4gWFopIR4VJ5Hqe74FD27okfiptmsASWWM1ozWLcRDSBoGFE0nVv8RFeEuVgPP3UQ7bRdcH9dRszY7NlD3CtyjF-6_ka27DBGaGhwslofC6-KIoBHsUfyzxIu3kkScWZQ_TUmAjq9FQBa3NIav5iupsXWOW1KBJeYhtNpiducfSVUhBy3EF"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#051424] via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-4">
                      <div className="flex items-center gap-2 bg-[#051424]/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                        <Terminal className="w-4 h-4 text-[#00ff85]" />
                        <span className="font-mono text-[10px] text-white uppercase tracking-widest">Проектирование реальности</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 3: PROMPT STEP (idx 2, 3, 5, 6, 8, 9, 10, 11 have prompts) */}
            {currentStep.promptContent && (
              <div className="space-y-6">
                
                {/* AI-powered Custom generator box */}
                <div className="glass-card p-6 rounded-xl border border-[#00ff85]/35 bg-[#00ff85]/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#00ff85]/10 to-transparent blur-xl pointer-events-none"></div>
                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#00ff85] animate-pulse" />
                        <h3 className="text-lg font-bold text-white">Интерактивный ИИ-Генератор</h3>
                      </div>
                      <p className="text-xs text-[#b9cbb9]">
                        Запустите ИИ-генерацию для своей идеи: <span className="text-white italic">"{userIdea}"</span>
                      </p>
                    </div>
                    <button 
                      onClick={() => handleGenerateStepArtifact(currentStep.id)}
                      disabled={isGenerating}
                      className="px-5 py-2.5 rounded bg-[#00ff85] text-[#00210c] hover:bg-[#61ff97] transition-all font-mono text-xs font-extrabold active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-[0_0_20px_rgba(0,255,133,0.3)] shrink-0"
                    >
                      {isGenerating ? "СИМУЛЯЦИЯ ИДЕТ..." : "ЗАПУСТИТЬ ИИ-СИМУЛЯЦИЮ"}
                    </button>
                  </div>

                  {/* Render simulated output if present */}
                  {stepSimulations[currentStep.id] && (
                    <div className="mt-6 p-4 md:p-6 rounded bg-[#010f1f] border border-[#00ff85]/30 flex flex-col gap-4 text-xs font-mono leading-relaxed text-white">
                      <div className="flex justify-between items-center pb-2 border-b border-white/15">
                        <span className="text-[#00ff85] font-bold flex items-center gap-1.5 uppercase">
                          <CheckCircle className="w-4 h-4" /> 
                          СИМУЛИРОВАННЫЙ АРТЕФАКТ ДЛЯ: "{userIdea.substring(0,35)}..."
                        </span>
                        <button 
                          onClick={() => handleCopyText(stepSimulations[currentStep.id], `${currentStep.id}_sim`)}
                          className="flex items-center gap-1 text-[#00ff85] hover:underline"
                        >
                          {copiedStates[`${currentStep.id}_sim`] ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>СКОПИРОВАНО</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>КОПИРОВАТЬ РЕЗУЛЬТАТ</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="whitespace-pre-wrap max-h-96 overflow-y-auto custom-scrollbar text-[#e2ede2]">
                        {stepSimulations[currentStep.id]}
                      </div>
                    </div>
                  )}
                </div>

                {/* Left/Right prompt layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Tasks / Metadata */}
                  <div className="lg:col-span-5 space-y-4">
                    
                    {/* Tasks or Guidelines depending on step */}
                    {currentStepIdx === 2 && (
                      <div className="glass-card p-6 rounded-xl space-y-4">
                        <h3 className="font-mono text-xs text-[#00ff85]/70 tracking-widest uppercase mb-2">ЧТО СДЕЛАЕТ ИИ</h3>
                        <ul className="space-y-3">
                          <li className="flex gap-3 items-start">
                            <span className="w-1.5 h-1.5 mt-2 rounded-full bg-[#00ff85] shadow-[0_0_8px_#00ff85]"></span>
                            <span className="text-sm font-light">
                              Создаст папку <code className="bg-[#1c2b3c] px-1 text-[#00ff85] rounded">0-подготовка/</code> со всеми вложенными файлами/папками
                            </span>
                          </li>
                          <li className="flex gap-3 items-start">
                            <span className="w-1.5 h-1.5 mt-2 rounded-full bg-[#00ff85] shadow-[0_0_8px_#00ff85]"></span>
                            <span className="text-sm font-light">
                              Создаст <code className="bg-[#1c2b3c] px-1 text-[#00ff85] rounded">CLAUDE.md</code> и <code class="bg-[#1c2b3c] px-1 text-[#00ff85] rounded">AGENTS.md</code> в корне
                            </span>
                          </li>
                          <li className="flex gap-3 items-start">
                            <span className="w-1.5 h-1.5 mt-2 rounded-full bg-[#00ff85] shadow-[0_0_8px_#00ff85]"></span>
                            <span className="text-sm font-light">
                              Создаст пустой <code className="bg-[#1c2b3c] px-1 text-[#00ff85] rounded">0-бриф.md</code> для фиксации результатов
                            </span>
                          </li>
                        </ul>
                      </div>
                    )}

                    {currentStepIdx === 3 && (
                      <div className="glass-card p-6 rounded-xl space-y-4">
                        <h3 className="font-mono text-xs text-[#00ff85]/70 tracking-widest uppercase flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-[#00ff85]" />
                          ЗАДАЧИ АНАЛИЗА
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 p-1 rounded">
                            <CheckCircle2 className="w-5 h-5 text-[#00ff85] shrink-0" />
                            <span className="text-sm">Определение Проблемы (Problem)</span>
                          </div>
                          <div className="flex items-center gap-3 p-1 rounded">
                            <div className="w-5 h-5 rounded-full border border-[#00ff85] flex items-center justify-center shrink-0">
                              <div className="w-2.5 h-2.5 bg-[#00ff85] rounded-full animate-pulse"></div>
                            </div>
                            <span className="text-sm font-semibold text-white">Профилирование ЦА (Audience)</span>
                          </div>
                          <div className="flex items-center gap-3 p-1 rounded opacity-50">
                            <div className="w-5 h-5 rounded-full border border-white/30 shrink-0"></div>
                            <span className="text-sm">Создание Портрета (Portrait)</span>
                          </div>
                          <div className="flex items-center gap-3 p-1 rounded opacity-50">
                            <div className="w-5 h-5 rounded-full border border-white/30 shrink-0"></div>
                            <span className="text-sm">Jobs to be Done (JTBD)</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStepIdx === 5 && (
                      <div className="glass-card p-6 rounded-xl space-y-4">
                        <h3 className="font-mono text-xs text-[#00ff85]/70 tracking-widest uppercase flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-[#00ff85]" />
                          ПОДГОТОВКА
                        </h3>
                        <ul className="space-y-3">
                          <li className="flex gap-2">
                            <div className="w-5 h-5 rounded-full border border-[#00ff85]/40 text-[#00ff85] flex items-center justify-center font-mono text-[9px] shrink-0 mt-0.5">1</div>
                            <span className="text-xs text-[#b9cbb9]">Гайд интервью: Создайте файл открытых вопросов.</span>
                          </li>
                          <li className="flex gap-2">
                            <div className="w-5 h-5 rounded-full border border-[#00ff85]/40 text-[#00ff85] flex items-center justify-center font-mono text-[9px] shrink-0 mt-0.5">2</div>
                            <span className="text-xs text-[#b9cbb9]">Транскрипты: Складывайте сырые записи в <code className="text-[#00ff85]">транскрипты/</code>.</span>
                          </li>
                          <li className="flex gap-2">
                            <div className="w-5 h-5 rounded-full border border-[#00ff85]/40 text-[#00ff85] flex items-center justify-center font-mono text-[9px] shrink-0 mt-0.5">3</div>
                            <span className="text-xs text-[#b9cbb9]">Анализ ИИ: Запустите поиск паттернов, результат пойдет в <code className="text-[#00ff85]">анализ/</code>.</span>
                          </li>
                        </ul>
                      </div>
                    )}

                    {currentStepIdx === 6 && (
                      <div className="glass-card p-6 rounded-xl space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-[#00ff85]/10 border border-[#00ff85]/30 flex items-center justify-center">
                            <Award className="w-5 h-5 text-[#00ff85]" />
                          </div>
                          <h3 className="font-bold text-white">Артефакты Этапа 0</h3>
                        </div>
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#00ff85] shrink-0 mt-0.5" />
                            <span className="text-xs">Портрет пользователя (боли и контекст)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#00ff85] shrink-0 mt-0.5" />
                            <span className="text-xs">Гипотеза ценности (готовность платить)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#00ff85] shrink-0 mt-0.5" />
                            <span className="text-xs">Логическая модель структуры данных</span>
                          </li>
                        </ul>
                        <div className="mt-4 p-3 rounded bg-white/5 text-[10px] text-[#b9cbb9] italic text-center">
                          "Теперь ИИ знает не просто 'что' делать, а 'зачем' и 'для кого'. Это исключает 80% ошибок."
                        </div>
                      </div>
                    )}

                    {/* Stage 1-4 Specific Left Layout Info elements */}
                    {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].includes(currentStepIdx) && (
                      <div className="glass-card p-6 rounded-xl space-y-4">
                        <h3 className="font-mono text-xs text-[#00ff85]/70 tracking-widest uppercase flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-[#00ff85]" />
                          НЕЙРО-ИНТЕЛЛЕКТ
                        </h3>
                        {currentStepIdx === 8 && (
                          <p className="text-xs text-[#b9cbb9]">
                            Автоматизируйте отрисовку реактивных состояний и проводите синтетические сессии с эмуляцией 1000 агентов.
                          </p>
                        )}
                        {currentStepIdx === 9 && (
                          <div className="space-y-2">
                            <div className="text-xs font-mono text-white flex justify-between">
                              <span>НЕЙРОННАЯ НАГРУЗКА</span>
                              <span className="text-[#00ff85]">84%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-[#00ff85] w-[84%]"></div>
                            </div>
                          </div>
                        )}
                        {currentStepIdx === 10 && (
                          <div className="space-y-1.5 text-xs">
                            <p className="font-bold text-[#00ff85]">Предотвращение циклов</p>
                            <p className="text-[#b9cbb9]">Защита от бесконечных вызовов агентов во время автономного кодинга.</p>
                          </div>
                        )}
                        {currentStepIdx === 11 && (
                          <div className="pt-2">
                            <span className="px-2 py-1 rounded bg-[#00ff85]/10 border border-[#00ff85]/30 text-[#00ff85] font-mono text-[10px]">
                              ACTIVE GTM AGENT RUNNING
                            </span>
                          </div>
                        )}
                        {currentStepIdx === 12 && (
                          <div className="space-y-3">
                            <p className="text-xs text-[#b9cbb9]">
                              Архитектурный каркас данных. Проектирование таблиц, кэширования ответов в Redis и интеграция векторных поисков.
                            </p>
                            <div className="p-3 rounded bg-[#010f1f] border border-white/5 text-[10px] font-mono space-y-1 text-white">
                              <div className="text-[#00ff85]">● pgvector index activated</div>
                              <div>● Multitenant schema: isolating tenant_id</div>
                              <div>● API Cost meter: dynamic counting</div>
                            </div>
                          </div>
                        )}
                        {currentStepIdx === 13 && (
                          <div className="space-y-3">
                            <p className="text-xs text-[#b9cbb9]">
                              Реализация ядра системы. Быстрый сбор рабочего скелета приложения с использованием ИИ во избежание оверинжиниринга.
                            </p>
                            <div className="flex gap-2">
                              <span className="px-2 py-0.5 rounded bg-[#00ff85]/10 border border-[#00ff85]/30 text-[#00ff85] font-mono text-[9px]">FastAPI CI/CD</span>
                              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white font-mono text-[9px]">React SPA</span>
                            </div>
                          </div>
                        )}
                        {currentStepIdx === 14 && (
                          <div className="space-y-3">
                            <p className="text-xs text-[#b9cbb9]">
                              Автоматическое выявление багов, галлюцинаций в стриминговых ответах и стресс-тестирование API на перегрузки лимитов.
                            </p>
                            <div className="flex justify-between text-[11px] font-mono text-white">
                              <span>ПОКРЫТИЕ ТЕСТАМИ</span>
                              <span className="text-[#00ff85]">87.4%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-[#00ff85] w-[87.4%]"></div>
                            </div>
                          </div>
                        )}
                        {currentStepIdx === 15 && (
                          <div className="space-y-3">
                            <p className="text-xs text-[#b9cbb9]">
                              Развертывание контейнеров в надежном облаке. Настройка Kubernetes репликаций, балансировщика и автомасштабирования.
                            </p>
                            <div className="p-2 bg-[#00ff85]/5 rounded border border-[#00ff85]/30 font-mono text-[10px] text-white">
                              <span>⚡ KUBE INGRESS: ACTIVE (3/3 reps)</span>
                            </div>
                          </div>
                        )}
                        {currentStepIdx === 16 && (
                          <div className="space-y-3">
                            <p className="text-xs text-[#b9cbb9]">
                              GTM и вирусный трафик. Генерация качественных материалов для запуска с помощью ИИ-маркетологов на HackerNews, Reddit и X.
                            </p>
                            <div className="text-[10px] font-mono text-[#00ff85]">
                              🚀 PH LAUNCH PREP: READY (100%)
                            </div>
                          </div>
                        )}
                        {currentStepIdx === 17 && (
                          <div className="space-y-3">
                            <p className="text-xs text-[#b9cbb9]">
                              Превращение лидов в продажи. Автоматический скоринг по GitHub/LinkedIn активности и персонализированные предложения ИИ-агентов.
                            </p>
                            <div className="p-2 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-[#b9cbb9]">
                              Lead Score Engine status: <span className="text-[#00ff85]">CONNECTED</span>
                            </div>
                          </div>
                        )}
                        {currentStepIdx === 18 && (
                          <div className="space-y-3">
                            <p className="text-xs text-[#b9cbb9]">
                              Анализ удовлетворенности пользователей по логам общения. Построение матрицы удержания и отчетов по фрикциям.
                            </p>
                            <div className="flex justify-between text-[10px] font-mono text-white">
                              <span>SENTIMENT SCORE</span>
                              <span className="text-[#00ff85]">+78 NPS</span>
                            </div>
                          </div>
                        )}
                        {currentStepIdx === 19 && (
                          <div className="space-y-3">
                            <p className="text-xs text-[#b9cbb9]">
                              Горизонтальное автомасштабирование подов и применение квантования весов LLM моделей для оптимизации памяти.
                            </p>
                            <div className="font-mono text-[10px] text-[#00ff85]">
                              ⚡ AVG INF. LATENCY: 95ms
                            </div>
                          </div>
                        )}
                        {currentStepIdx === 20 && (
                          <div className="space-y-3">
                            <p className="text-xs text-[#b9cbb9]">
                              Автоматический разбор тикетов поддержки и формирование беклога фич. Вы успешно завершили весь курс!
                            </p>
                            <div className="p-3 bg-gradient-to-r from-[#00ff85]/15 to-transparent rounded border border-[#00ff85]/40 text-center animate-pulse">
                              <span className="font-mono text-[10px] text-[#00ff85] font-bold">🎓 СЕРТИФИКАТ СФОРМИРОВАН</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Callout box common */}
                    <div className="border border-dashed border-[#00ff85]/20 p-4 rounded-xl bg-[#00ff85]/5 relative overflow-hidden group">
                      <div className="relative z-10">
                        <h4 className="text-[10px] font-mono font-bold text-white mb-1 flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-[#00ff85]" />
                          ВАЖНОЕ ПРИМЕЧАНИЕ
                        </h4>
                        <p className="text-xs text-[#b9cbb9] leading-relaxed">
                          ИИ не просто пишет текст — он ищет скрытые боли, инъекции и проводит стресс-тесты. Не пытайтесь заменять его ручным вводом.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Code block with prompt */}
                  <div className="lg:col-span-7">
                    <div className="glass-card active-border rounded-xl p-0 overflow-hidden relative">
                      <div className="flex justify-between items-center px-4 py-3 bg-white/5 border-b border-white/5">
                        <span className="font-mono text-[11px] text-[#b9cbb9] flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-[#00ff85]" />
                          {currentStep.promptTitle || "Prompt Block"}
                        </span>
                        <button 
                          onClick={() => handleCopyText(currentStep.promptContent || "", currentStep.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#00ff85]/10 hover:bg-[#00ff85]/20 text-[#00ff85] rounded font-mono text-[10px] active:scale-95 transition-all"
                        >
                          {copiedStates[currentStep.id] ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>СКОПИРОВАНО!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>СКОПИРОВАТЬ ПРОМПТ</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Display prompt content */}
                      <div className="p-4 md:p-6 bg-[#010f1f]/80 max-h-[460px] overflow-y-auto custom-scrollbar">
                        <MarkdownRenderer text={currentStep.promptContent?.replace("{{PRODUCT_NAME}}", userIdea) || ""} />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* SCREEN 5: PROJECT DIRECTORY STRUCTURE (StepIdx 4) */}
            {currentStepIdx === 4 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left block Tree view */}
                  <div className="lg:col-span-7 glass-card p-6 rounded-xl active-border relative overflow-hidden group">
                    <div className="absolute top-4 right-4 opacity-50 hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleCopyText(`my-product/
├── CLAUDE.md + AGENTS.md
└── 0-подготовка/
    ├── проблема.md
    ├── аудитория.md
    ├── портрет.md
    ├── jtbd.md
    └── интервью/
        ├── гайд-интервью.md
        ├── транскрипты/
        └── анализ/
            ├── анализ-*.md
            └── итог-всех-интервью.md
└── 0-бриф.md`, "dir_tree")}
                        className="p-1.5 hover:bg-white/5 rounded"
                      >
                        {copiedStates["dir_tree"] ? <Check className="w-4 h-4 text-[#00ff85]" /> : <Copy className="w-4 h-4 text-[#00ff85]" />}
                      </button>
                    </div>

                    <div className="font-mono text-xs text-[#e2ede2] leading-relaxed">
                      <div className="flex items-baseline mb-2">
                        <span className="text-[#00ff85] font-bold">my-product/</span>
                        <span className="text-white/40 ml-4">← название твоей папки</span>
                      </div>
                      <div className="flex">
                        <span className="text-white/20 mr-2">├──</span>
                        <div className="text-[#00ff85]">CLAUDE.md <span className="text-white">+</span> AGENTS.md</div>
                        <span className="text-white/40 ml-4 italic">правила работы (одинаковые)</span>
                      </div>
                      <div className="flex">
                        <span className="text-white/20 mr-2">├──</span>
                        <div className="text-[#00ff85]">0-подготовка/</div>
                      </div>
                      <div className="flex pl-4">
                        <span className="text-white/20 mr-2">├──</span>
                        <div className="text-white">проблема.md</div>
                        <span className="text-white/40 ml-4 opacity-60">← Шаг 2</span>
                      </div>
                      <div className="flex pl-4">
                        <span className="text-white/20 mr-2">├──</span>
                        <div className="text-white">аудитория.md</div>
                        <span className="text-white/40 ml-4 opacity-60">← Шаг 3-5</span>
                      </div>
                      <div className="flex pl-4">
                        <span className="text-white/20 mr-2">├──</span>
                        <div className="text-white">портрет.md</div>
                        <span className="text-white/40 ml-4 opacity-60">← Шаг 6 (опц.)</span>
                      </div>
                      <div className="flex pl-4">
                        <span className="text-white/20 mr-2">├──</span>
                        <div className="text-white">jtbd.md</div>
                        <span className="text-white/40 ml-4 opacity-60">← Шаг 7</span>
                      </div>
                      <div className="flex pl-4">
                        <span className="text-white/20 mr-2">├──</span>
                        <div className="text-[#00ff85]">интервью/</div>
                      </div>
                      <div className="flex pl-8">
                        <span className="text-white/20 mr-2">├──</span>
                        <div className="text-white">гайд-интервью.md</div>
                        <span className="text-white/40 ml-4 opacity-60">← Шаг 8</span>
                      </div>
                      <div className="flex pl-8">
                        <span className="text-white/20 mr-2">├──</span>
                        <div className="text-white">транскрипты/</div>
                        <span className="text-white/40 ml-4 opacity-60">← кладёшь сам</span>
                      </div>
                      <div className="flex pl-8">
                        <span className="text-white/20 mr-2">├──</span>
                        <div className="text-[#00ff85]">анализ/</div>
                      </div>
                      <div className="flex pl-12">
                        <span className="text-white/20 mr-2">└──</span>
                        <div className="text-white">анализ-*.md</div>
                        <span className="text-white/40 ml-4 opacity-60">← Шаг 9</span>
                      </div>
                      <div className="flex pl-8">
                        <span className="text-white/20 mr-2">└──</span>
                        <div className="text-white">итог-всех-интервью.md</div>
                        <span className="text-white/40 ml-4 opacity-60">← Шаг 10</span>
                      </div>
                      <div className="flex">
                        <span className="text-white/20 mr-2">└──</span>
                        <div className="text-[#00ff85] font-bold">0-бриф.md</div>
                        <span className="text-white/40 ml-4 lowercase font-normal opacity-60">← Шаг 11 • ГЛАВНЫЙ ИТОГ</span>
                      </div>
                    </div>
                  </div>

                  {/* Right block Rules */}
                  <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="glass-card p-6 rounded-xl">
                      <h3 className="text-lg font-bold text-white mb-4">3 правила структуры</h3>
                      <ul className="space-y-4">
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-[#00ff85]"></span>
                          <div className="text-xs">
                            <span className="font-bold text-white text-sm block">Папка одна на проект</span>
                            Назови как угодно — <code className="bg-white/5 text-[#00ff85] px-1 rounded font-mono">my-product</code>, <code className="bg-white/5 text-[#00ff85] px-1 rounded font-mono">ai-startup</code>. Структура внутри должна быть одинаковой.
                          </div>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-[#00ff85]"></span>
                          <div className="text-xs">
                            <span className="font-bold text-white text-sm block">Имена файлов фиксированные</span>
                            Будущие этапы кода будут искать именно эти имена. Не переименовывай их.
                          </div>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-[#00ff85]"></span>
                          <div className="text-xs">
                            <span className="font-bold text-white text-sm block">Главный файл — 0-бриф.md</span>
                            На него опираются абсолютно все ИИ-инструменты на последующих шагах проектирования.
                          </div>
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl border border-[#00ff85]/20 bg-[#00ff85]/5 gap-3 flex items-center">
                      <Info className="w-5 h-5 text-[#00ff85] shrink-0" />
                      <p className="text-xs text-[#b9cbb9]">
                        ИИ сам прочитает файлы по путям, например: <code className="bg-black/30 text-[#00ff85] font-mono px-1 rounded">0-подготовка/проблема.md</code>. Копировать руками ничего не нужно.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 8: THREE TYPES OF PRODUCTS (StepIdx 7) */}
            {currentStepIdx === 7 && (
              <div className="space-y-6">
                
                {/* Product Type interactive selector */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Option A */}
                  <div 
                    onClick={() => setSelectedProductType("A")}
                    className={`glass-card p-6 rounded-xl relative overflow-hidden flex flex-col justify-between h-full cursor-pointer hover:scale-[1.02] border transition-all ${
                      selectedProductType === "A" ? "border-[#00ff85] shadow-[0_0_25px_rgba(0,255,133,0.15)] bg-[#0c202a]" : "border-white/10"
                    }`}
                  >
                    <div className="absolute top-3 right-3 text-[#00ff85] opacity-20">
                      <span className="text-xs font-mono font-bold block">A</span>
                    </div>
                    <div>
                      <span className="text-5xl font-mono font-bold text-[#00ff85] neon-glow block mb-2">A</span>
                      <h3 className="text-xl font-bold text-white mb-2">Внешний продукт</h3>
                      <p className="text-xs text-[#b9cbb9] leading-relaxed mb-6">
                        SaaS-сервис, мобильное приложение, публичный сайт, B2B-решение для открытого рынка.
                      </p>
                    </div>
                    <div className="pt-4 border-t border-white/5 space-y-1">
                      <span className="text-[10px] font-mono font-bold text-[#00ff85] tracking-wider block">ОСОБЕННОСТЬ:</span>
                      <p className="text-xs text-white">Нужен анализ конкурентов, маркетинг и монетизация.</p>
                    </div>
                  </div>

                  {/* Option B */}
                  <div 
                    onClick={() => setSelectedProductType("B")}
                    className={`glass-card p-6 rounded-xl relative overflow-hidden flex flex-col justify-between h-full cursor-pointer hover:scale-[1.02] border transition-all ${
                      selectedProductType === "B" ? "border-[#00ff85] shadow-[0_0_25px_rgba(0,255,133,0.15)] bg-[#0c202a]" : "border-white/10"
                    }`}
                  >
                    <div className="absolute top-3 right-3 text-[#00ff85] opacity-20">
                      <span className="text-xs font-mono font-bold block">B</span>
                    </div>
                    <div>
                      <span className="text-5xl font-mono font-bold text-[#00ff85] neon-glow block mb-2">B</span>
                      <h3 className="text-xl font-bold text-white mb-2">Внутренний продукт</h3>
                      <p className="text-xs text-[#b9cbb9] leading-relaxed mb-6">
                        Инструмент для автоматизации процессов внутри конкретного отдела или компании.
                      </p>
                    </div>
                    <div className="pt-4 border-t border-white/5 space-y-1">
                      <span className="text-[10px] font-mono font-bold text-[#00ff85] tracking-wider block">ОСОБЕННОСТЬ:</span>
                      <p className="text-xs text-white">Нужно согласование руководства и интеграция со старыми корпоративными базами.</p>
                    </div>
                  </div>

                  {/* Option C */}
                  <div 
                    onClick={() => setSelectedProductType("C")}
                    className={`glass-card p-6 rounded-xl relative overflow-hidden flex flex-col justify-between h-full cursor-pointer hover:scale-[1.02] border transition-all ${
                      selectedProductType === "C" ? "border-[#00ff85] shadow-[0_0_25px_rgba(0,255,133,0.15)] bg-[#0c202a]" : "border-white/10"
                    }`}
                  >
                    <div className="absolute top-3 right-3 text-[#00ff85] opacity-20">
                      <span className="text-xs font-mono font-bold block">C</span>
                    </div>
                    <div>
                      <span className="text-5xl font-mono font-bold text-[#00ff85] neon-glow block mb-2">C</span>
                      <h3 className="text-xl font-bold text-white mb-2">Личный / Нишевый</h3>
                      <p className="text-xs text-[#b9cbb9] leading-relaxed mb-6">
                        Продукт для локальных задач, личного пользования или утилита для узкого сообщества.
                      </p>
                    </div>
                    <div className="pt-4 border-t border-white/5 space-y-1">
                      <span className="text-[10px] font-mono font-bold text-[#00ff85] tracking-wider block">ОСОБЕННОСТЬ:</span>
                      <p className="text-xs text-white">Максимум гибкости, отсутствие формальностей при запуске.</p>
                    </div>
                  </div>

                </div>

                {/* Simulated Stack/Path recommendations visual block */}
                <div className="glass-card rounded-xl p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-full border border-[#00ff85] flex items-center justify-center text-[#00ff85] shrink-0 shadow-[0_0_15px_rgba(0,255,133,0.3)]">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold font-mono">
                        Инновационный стек для категории {selectedProductType === "A" ? "A (SaaS рынок)" : selectedProductType === "B" ? "B (Внутренние системы)" : "C (Нишевая утилита)"}
                      </h4>
                      <p className="text-xs text-[#b9cbb9] mt-0.5">
                        {selectedProductType === "A" ? "Рекомендуем: React 19 + Express + Vector embeddings Qdrant + Stripe Checkout + Vercel Edge." : 
                         selectedProductType === "B" ? "Рекомендуем: Docker + Node-RED + LangChain flow + Google Spanner + LDAP Windows Auth." : 
                         "Рекомендуем: Python CLI script + SQLite btree + Gemini API key + Streamlit UI."}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleGenerateStepArtifact("types")}
                    className="px-4 py-2 bg-[#00ff85] text-[#00210c] text-xs font-mono font-bold rounded-lg hover:brightness-110 shrink-0 select-none shadow-[0_0_15px_rgba(0,255,133,0.3)] active:scale-95 transition-transform"
                  >
                    ПОСМОТРЕТЬ СТЕК ИИ
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 1-4 COMPONENT DECORATIVE MEDIA */}
            {currentStepIdx === 8 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-6 rounded-xl flex items-center gap-4 hover:bg-white/5 cursor-pointer">
                  <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center shrink-0">
                    <Target className="text-[#00ff85] w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Атомарные системы потоков</h4>
                    <p className="text-xs text-[#b9cbb9]">Определение конечных автоматов для нейронных интерфейсов.</p>
                  </div>
                </div>
                <div className="glass-card p-6 rounded-xl flex items-center gap-4 hover:bg-white/5 cursor-pointer">
                  <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center shrink-0">
                    <Activity className="text-[#00ff85] w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Синтетическое UX-тестирование</h4>
                    <p className="text-xs text-[#b9cbb9]">Симуляция 1000 параллельных сессий в реальном времени с ИИ.</p>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 2 COMPONENT DECORATIVE MEDIA */}
            {currentStepIdx === 9 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="glass-card p-4 rounded-xl space-y-2">
                  <div className="aspect-video rounded-lg overflow-hidden relative">
                    <img 
                      className="object-cover w-full h-full opacity-60" 
                      referrerPolicy="no-referrer"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJkATMP5NWFTEcGqENQH0ur4dWNGNbzEe6OQXb2-3wd538KYsBPyFp-2vUK87eWQAORv1QaeC3nVTcOYCYOsChI7zi1G4dTNa2wtLmnhER7tcqBrF4I_Vo8kdHjFX0g0iT7PnLJv11yZvusEde3xmjQdJUegNfgPpdK25C1lCb-F3yUsJPiYKOwgW9wA6D96Osc1gMgJswTrSQ_x7DwJlLN4Z3deQl0VHOgI_eBDuZtnyBSVnd6nTEYKLvkRL6yGzSDFIU8mmqWW0Y"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#051424] to-transparent"></div>
                    <div className="absolute bottom-3 left-3">
                      <span className="font-mono text-xs text-[#00ff85] font-bold uppercase">Автоматическая сортировка</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#b9cbb9]">ИИ автоматически приоритизирует технический долг, спринты и баги.</p>
                </div>

                <div className="glass-card p-4 rounded-xl space-y-2">
                  <div className="aspect-video rounded-lg overflow-hidden relative">
                    <img 
                      className="object-cover w-full h-full opacity-60" 
                      referrerPolicy="no-referrer"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0e8thirqqr0ZCgtwgr8JUlFyBGV7QmcXEfArE48Bp75c0dD-py4hQJbgyYB1SUsNhmOuzXM3q34dk4JiRkSf7490XEJFlohSct2qWI2HgMVpqQy_cRPjcsZTATeUCDPTNcnaT0BrvsasKMUG9mOB8eoWnPdz7ckJnnEJfrSAMK-AWv3O0TqhQPHiJiv8hiXPWf-FLahSS5cF4gwk64fWa0GTJeOTBnvAjkJkmrmXIEctiIXId4Ug3vz7mWNXQkINc0BELKX7cH1ZO"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#051424] to-transparent"></div>
                    <div className="absolute bottom-3 left-3">
                      <span className="font-mono text-xs text-[#00ff85] font-bold uppercase">Реальное время</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#b9cbb9]">Интерактивная аналитика скорости команды основывается на поведении ИИ-агентов.</p>
                </div>
              </div>
            )}

            {/* STAGE 3 COMPONENT DECORATIVE MEDIA */}
            {currentStepIdx === 10 && (
              <div className="space-y-4 shadow-[#00ff85]/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-card p-5 rounded-xl border border-white/5">
                    <span className="font-mono text-[10px] text-[#00ff85] block mb-2 uppercase">Рейтинг безопасности</span>
                    <h3 className="text-2xl font-bold font-mono">99.98%</h3>
                    <p className="text-xs text-[#b9cbb9] mt-2">Уровень защиты промптов от Prompt Injection атак после валидации.</p>
                  </div>
                  <div className="glass-card p-5 rounded-xl border border-white/5">
                    <span className="font-mono text-[10px] text-[#00ff85] block mb-2 uppercase">Тестирование</span>
                    <h3 className="text-2xl font-bold font-mono">10мс</h3>
                    <p className="text-xs text-[#b9cbb9] mt-2">Средняя скорость фильтрации персональных данных (санация PII).</p>
                  </div>
                </div>

                <div className="relative h-64 rounded-xl overflow-hidden border border-white/10 group">
                  <img 
                    alt="Сеть кибербезопасности" 
                    className="w-full h-full object-cover grayscale brightness-50 group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLZyu8iTVXTNCnKN684sMCG5toQG7_srBJdfh3sWeFYM5hHdPSez6nA3w_V2ESoeukmL_TTzbpfazfM0z4nOfROt8wHtqTzgZs2oEu5nTgf5YKPi13_X-pb3OE4N0KRyAPEzcI8wQnJh-WcsPHBEPKFUPWfHs66sRYdp7TtjgGP6KyGT91nYlhfy0LJ5iJ60TtyETyMTtwiK9gfa606151vIAyL0Cp1wbDE1y-1ySPaM7Qy6sAedGgTL-4mRHRWFmucJbtuO7RTdED"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#051424] via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center gap-2 text-[#00ff85]">
                      <span className="w-2.5 h-2.5 bg-[#00ff85] rounded-full animate-ping"></span>
                      <span className="font-mono text-xs uppercase tracking-widest">Статус: Глобальный щит активен</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 4 COMPONENT DECORATIVE MEDIA */}
            {currentStepIdx === 11 && (
              <div className="space-y-4">
                <div className="w-full aspect-video rounded-xl overflow-hidden glass-card relative group">
                  <img 
                    alt="Превентивная аналитика" 
                    className="w-full h-full object-cover opacity-60 mix-blend-overlay group-hover:scale-105 transition-transform duration-1000"
                    referrerPolicy="no-referrer"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqKcstj2hz1axAo9BCSfabq_usR3_pkdcYsypvr7sdG9_NyU0OuuB4e6q84oIRvltPplAr5Ak7Z0i5-wyb01ROdPGNbq69TZAmzyuJRY870sljqpJwY6lxzXjCDUg5sampBuetpvlQ2rrGu9_mlNWocf4w2J-yj04iedh5w8icQ2kDhTAb2vGqIIxkc8y8WOf0wDbqDZszxsqgoA8Ybw0_AZKEIsUpLE6q9Df9JYMrmaDSPlS7p2mApuE861h8fXX_ISLvZi4o8_ts"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#051424] via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <span className="text-[10px] font-mono font-bold text-[#00ff85] uppercase tracking-wider block mb-1">ПРЕДИКТИВНАЯ АНАЛИТИКА РОСТА</span>
                    <h4 className="text-xl font-bold text-white">GTM Neural Engine v1.4</h4>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 5 DECORATIVE MEDIA: ARCHITECTURE */}
            {currentStepIdx === 12 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-card p-5 rounded-xl border border-white/5 space-y-2">
                    <span className="font-mono text-[10px] text-[#00ff85] block uppercase">ВЕКТОРНАЯ БАЗА ДАННЫХ</span>
                    <h3 className="text-lg font-bold text-white">pgvector @ elephant_db</h3>
                    <p className="text-xs text-[#b9cbb9]">Индексация HNSW для 1536-мерных эмбеддингов ИИ-содержимого.</p>
                  </div>
                  <div className="glass-card p-5 rounded-xl border border-white/5 space-y-2">
                    <span className="font-mono text-[10px] text-[#00ff85] block uppercase">LLM CACHE LAYER</span>
                    <h3 className="text-lg font-bold text-white">Redis Cluster</h3>
                    <p className="text-xs text-[#b9cbb9]">Экономия до 40% стоимости токенов за счет интеллектуального кэширования одинаковых промптов.</p>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 6 DECORATIVE MEDIA: MVP */}
            {currentStepIdx === 13 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-5 rounded-xl border border-white/5 space-y-1">
                  <span className="font-mono text-[10px] text-[#00ff85] block uppercase">PRODUCT STACK</span>
                  <div className="text-xl font-bold font-mono text-white flex gap-2">
                    <span>FastAPI</span>
                    <span className="text-white/30">+</span>
                    <span>React</span>
                  </div>
                  <p className="text-xs text-[#b9cbb9] pt-1">Минимальное готовое ядро системы. Максимальная реактивность.</p>
                </div>
                <div className="glass-card p-5 rounded-xl border border-white/5 space-y-2">
                  <span className="font-mono text-[10px] text-[#00ff85] block uppercase">ФИТЧИ КАРТЫ MVP</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white font-mono">Аутентификация</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#00ff85]/10 border border-[#00ff85]/20 text-[#00ff85] font-mono">API Proxy</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white font-mono">Streaming UX</span>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 7 DECORATIVE MEDIA: TESTING */}
            {currentStepIdx === 14 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass-card p-4 rounded-xl border border-white/5 text-center">
                    <div className="text-2xl font-bold font-mono text-[#00ff85]">42 / 42</div>
                    <div className="text-[10px] font-mono text-[#b9cbb9] uppercase mt-1">UNIT TESTS</div>
                  </div>
                  <div className="glass-card p-4 rounded-xl border border-white/5 text-center">
                    <div className="text-2xl font-bold font-mono text-[#00ff85]">100%</div>
                    <div className="text-[10px] font-mono text-[#b9cbb9] uppercase mt-1">SCHEMA INTEGRITY</div>
                  </div>
                  <div className="glass-card p-4 rounded-xl border border-white/5 text-center">
                    <div className="text-2xl font-bold font-mono text-[#00ff85]">0 ms</div>
                    <div className="text-[10px] font-mono text-[#b9cbb9] uppercase mt-1">HALLUCINATIONS</div>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 8 DECORATIVE MEDIA: DEPLOY */}
            {currentStepIdx === 15 && (
              <div className="glass-card p-5 rounded-xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] text-[#00ff85] uppercase">KUBERNETES DEPLOYMENT MANIFEST</span>
                  <span className="text-[#00ff85] font-mono text-[10px] bg-[#00ff85]/10 border border-[#00ff85]/30 px-2 py-0.5 rounded">STATUS: STABLE</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span>Active Containers (Pods)</span>
                    <span>3 / 3</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00ff85] w-full"></div>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 9 DECORATIVE MEDIA: MARKETING */}
            {currentStepIdx === 16 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-5 rounded-xl border border-white/5 space-y-2">
                  <span className="font-mono text-[10px] text-[#00ff85] block uppercase">LAUNCH CHANNELS</span>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span>Product Hunt Hunt #1 Day</span><span className="text-[#00ff85]">Ready</span></div>
                    <div className="flex justify-between"><span>Reddit Seeding (r/SaaS)</span><span className="text-[#00ff85]">Ready</span></div>
                    <div className="flex justify-between"><span>X Viral Loops Engine</span><span className="text-[#00ff85]">Ready</span></div>
                  </div>
                </div>
                <div className="glass-card p-5 rounded-xl border border-white/5 space-y-2 flex flex-col justify-center">
                  <span className="font-mono text-[10px] text-[#00ff85] block uppercase">GTM VIRAL MULTIPLIER</span>
                  <div className="text-3xl font-bold font-mono text-[#00ff85]">+320%</div>
                  <p className="text-[10px] text-[#b9cbb9]">Показатель естественного вирального прироста ИИ-инвайтов.</p>
                </div>
              </div>
            )}

            {/* STAGE 10 DECORATIVE MEDIA: SALES */}
            {currentStepIdx === 17 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass-card p-4 rounded-xl border border-white/5 space-y-1">
                    <div className="text-[10px] font-mono text-[#b9cbb9] uppercase">MOCK LEADS</div>
                    <div className="text-xl font-bold font-mono text-white">412</div>
                  </div>
                  <div className="glass-card p-4 rounded-xl border border-white/5 space-y-1">
                    <div className="text-[10px] font-mono text-[#b9cbb9] uppercase">MRR RUN-RATE</div>
                    <div className="text-xl font-bold font-mono text-[#00ff85]">$12,450</div>
                  </div>
                  <div className="glass-card p-4 rounded-xl border border-white/5 space-y-1">
                    <div className="text-[10px] font-mono text-[#b9cbb9] uppercase">LTV MATCH</div>
                    <div className="text-xl font-bold font-mono text-white">12.5 months</div>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 11 DECORATIVE MEDIA: ANALYTICS */}
            {currentStepIdx === 18 && (
              <div className="glass-card p-5 rounded-xl border border-white/5 space-y-4">
                <span className="font-mono text-[10px] text-[#00ff85] block uppercase">УДОВЛЕТВОРЕННОСТЬ ПОЛЬЗОВАТЕЛЕЙ (SENTIMENT MAP)</span>
                <div className="grid grid-cols-3 gap-2 items-end h-24 pt-4 border-b border-white/10">
                  <div className="bg-[#00ff85]/30 h-[80%] rounded-t flex items-center justify-center font-mono text-[10px] text-white">82% Positive</div>
                  <div className="bg-white/10 h-[15%] rounded-t flex items-center justify-center font-mono text-[10px] text-white">15% Neutral</div>
                  <div className="bg-red-500/20 h-[5%] rounded-t flex items-center justify-center font-mono text-[10px] text-white">3% Negative</div>
                </div>
              </div>
            )}

            {/* STAGE 12 DECORATIVE MEDIA: SCALING */}
            {currentStepIdx === 19 && (
              <div className="space-y-4">
                <div className="glass-card p-5 rounded-xl border border-white/5 space-y-2">
                  <span className="font-mono text-[10px] text-[#00ff85] block uppercase">HORIZON AUTOSCALING POLICY</span>
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div>🔥 Min Replicas: <span className="text-[#00ff85]">3 pods</span></div>
                    <div>🔥 Max Replicas: <span className="text-[#00ff85]">50 pods</span></div>
                    <div>🎯 Target CPU: <span className="text-[#00ff85]">70%</span></div>
                    <div>🎯 custom Metric (Inference Queue): <span className="text-[#00ff85]">Active</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 13 DECORATIVE MEDIA: SUPPORT & DOCK CERTIFICATE */}
            {currentStepIdx === 20 && (
              <div className="space-y-6">
                {/* Visual Graduation Certificate of completion */}
                <div className="relative bg-gradient-to-br from-[#021020] to-[#041a30] p-8 md:p-12 rounded-2xl border-2 border-[#00ff85]/60 shadow-[0_0_50px_rgba(0,255,133,0.15)] text-center overflow-hidden">
                  {/* Neural cyber watermark */}
                  <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_center,rgba(0,255,133,0.03)_0%,transparent_70%)] pointer-events-none"></div>
                  
                  {/* Decorative corner lines */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#00ff85]/30"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#00ff85]/30"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#00ff85]/30"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#00ff85]/30"></div>

                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-full bg-[#00ff85]/10 border border-[#00ff85]/40 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,133,0.2)]">
                        <Award className="w-8 h-8 text-[#00ff85] animate-bounce" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="font-mono text-xs text-[#00ff85] tracking-widest uppercase">GRADUATION CERTIFICATE</span>
                      <h3 className="text-2xl md:text-3xl font-extrabold font-mono tracking-tight text-white uppercase">AI PRODUCT BUILDER</h3>
                    </div>

                    <p className="text-xs text-[#b9cbb9] max-w-lg mx-auto leading-relaxed">
                      Настоящий ИИ-сертификат подтверждает, что студент успешно защитил идею продукта <span className="text-white font-bold font-mono italic">"{userIdea || "Без названия"}"</span> и прошел все практические этапы продуктовой разработки: от валидации проблем до GTM, масштабирования инфраструктуры и автоматизации поддержки.
                    </p>

                    <div className="pt-6 grid grid-cols-2 gap-4 border-t border-white/10 text-left">
                      <div>
                        <span className="block font-mono text-[9px] text-white/50 uppercase">СТАТУС ИСПЫТАНИЯ</span>
                        <span className="text-[#00ff85] font-mono text-xs font-bold uppercase">ВЫПУСКНИК КУРСA</span>
                      </div>
                      <div className="text-right">
                        <span className="block font-mono text-[9px] text-white/50 uppercase">ОЦЕНКА ИИ-ЖЮРИ</span>
                        <span className="text-[#00ff85] font-mono text-xs font-bold">100 / 100 EXCELLENT</span>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-center">
                      <button 
                        onClick={() => window.print()}
                        className="px-6 py-3 rounded bg-gradient-to-r from-[#00ff85] to-[#61ff97] text-[#00210c] text-xs font-mono font-black uppercase tracking-wider shadow-[0_0_30px_rgba(0,255,133,0.3)] hover:scale-105 active:scale-95 transition-all"
                      >
                        🖨️ ПЕЧАТЬ СЕРТИФИКАТА
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons at bottom */}
            <div className="flex justify-between items-center pt-8 border-t border-white/10">
              <button 
                onClick={handlePrevStep}
                disabled={currentStepIdx === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-sm font-mono text-[#b9cbb9] disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>НАЗАД</span>
              </button>

              <div className="hidden md:flex gap-1.5">
                {COURSE_STEPS.map((step, idx) => (
                  <div 
                    key={step.id} 
                    onClick={() => setCurrentStepIdx(idx)}
                    className={`w-3 h-3 rounded-full cursor-pointer transition-all ${
                      currentStepIdx === idx ? "bg-[#00ff85] scale-125" : 
                      completedSteps.includes(idx) ? "bg-[#00ff85]/55 shadow-xs" : "bg-white/10"
                    }`}
                  />
                ))}
              </div>

              <button 
                onClick={handleNextStep}
                className="flex items-center gap-1.5 px-6 py-3 rounded-full bg-[#00ff85] text-[#00210c] font-mono text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,255,133,0.3)] select-none uppercase"
              >
                <span>{currentStepIdx === COURSE_STEPS.length - 1 ? "СМОТРЕТЬ ПРОГРЕСС" : "НАЧАТЬ ОБУЧЕНИЕ • СЛЕДУЮЩИЙ"}</span>
                <ChevronRight className="w-4 h-4 font-bold" />
              </button>
            </div>

          </div>
        )}

        {/* PROMPTS LIBRARY TAB */}
        {activeTab === "prompts" && (
          <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold text-[#00ff85] neon-glow">Библиотека системных промптов</h1>
              <p className="text-[#b9cbb9] text-sm">
                Здесь собраны все промпты-инструкции курса, которые вы передаете ИИ для автоматической генерации архитектурных слоев продукта.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {COURSE_STEPS.filter(step => step.promptContent).map((step) => {
                const isCopied = copiedStates[`lib_${step.id}`];
                const content = step.promptContent?.replace("{{PRODUCT_NAME}}", userIdea) || "";
                return (
                  <div key={`lib_${step.id}`} className="glass-card rounded-xl overflow-hidden border border-[#00ff85]/20">
                    <div className="px-4 py-3 bg-[#0d1c2d] flex justify-between items-center border-b border-[#00ff85]/10">
                      <div className="flex items-center gap-2">
                        <Terminal className="text-[#00ff85] w-4 h-4" />
                        <span className="font-mono text-xs font-bold text-white">{step.promptTitle}</span>
                        <span className="text-[9px] font-mono text-white/50">{step.stepNumLabel}</span>
                      </div>
                      <button 
                        onClick={() => handleCopyText(content, `lib_${step.id}`)}
                        className="flex items-center gap-1 text-[#00ff85] hover:underline font-mono text-[10px]"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>КОПИРОВАНО!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>СКОПИРОВАТЬ</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-4 bg-[#010f1f]/90 max-h-60 overflow-y-auto custom-scrollbar">
                      <MarkdownRenderer text={content} />
                    </div>
                    <div className="px-4 py-2 bg-white/2 bg-opacity-10 text-[10px] text-[#b9cbb9] italic text-right border-t border-white/5">
                      Курс: {step.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PROGRESS TRACKER TAB */}
        {activeTab === "progress" && (
          <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold text-white">Твой прогресс обучения</h1>
              <p className="text-[#b9cbb9] text-sm">Отслеживайте освоение этапов создания ИИ-продуктов.</p>
            </div>

            {/* Big circular or simple modern progress banner */}
            <div className="glass-card p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 active-border">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-4 border-[#00ff85] flex items-center justify-center text-xl font-mono text-[#00ff85] font-bold shadow-[0_0_15px_rgba(0,255,133,0.3)] shrink-0">
                  {getProgressPercentage()}%
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Ты отлично продвигаешься!</h3>
                  <p className="text-xs text-[#b9cbb9] mt-0.5">
                    Получено артефактов: {completedSteps.length} из {COURSE_STEPS.length}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setCurrentStepIdx(0);
                  setActiveTab("study");
                }}
                className="px-5 py-2.5 bg-[#00ff85] text-[#00210c] text-xs font-mono font-bold rounded-lg hover:scale-105 active:scale-95 transition-transform shadow-[0_0_15px_rgba(0,255,133,0.3)] uppercase"
              >
                Вернуться к первому шагу
              </button>
            </div>

            {/* List of steps and statuses */}
            <div className="space-y-3">
              {COURSE_STEPS.map((step, idx) => {
                const isCompleted = completedSteps.includes(idx);
                const isCurrent = currentStepIdx === idx;
                return (
                  <div 
                    key={`tracking_${step.id}`}
                    onClick={() => {
                      setCurrentStepIdx(idx);
                      setActiveTab("study");
                    }}
                    className={`glass-card p-4 rounded-xl flex items-center justify-between cursor-pointer border hover:translate-x-1 transition-all ${
                      isCurrent ? "border-[#00ff85] bg-[#0c202a]" : 
                      isCompleted ? "border-[#00ff85]/20" : "border-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isCompleted ? (
                        <CheckCircle2 className="text-[#00ff85] w-5 h-5 shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-white/30 shrink-0 flex items-center justify-center">
                          <span className="text-[9px] font-mono text-white/50">{idx + 1}</span>
                        </div>
                      )}
                      <div>
                        <span className="block font-mono text-[9px] text-[#00ff85]/70 uppercase">{step.stepNumLabel}</span>
                        <h4 className="text-sm font-bold text-white/90">{step.title}</h4>
                      </div>
                    </div>

                    <div className="text-right">
                      {isCurrent ? (
                        <span className="px-2 py-0.5 bg-[#00ff85]/10 border border-[#00ff85]/35 text-[#00ff85] font-mono text-[9px] rounded uppercase animate-pulse">
                          ТЕКУЩИЙ
                        </span>
                      ) : isCompleted ? (
                        <span className="text-[#00ff85] font-mono text-[10px] uppercase">
                          ПРОЙДЕНО
                        </span>
                      ) : (
                        <span className="text-white/30 font-mono text-[10px] uppercase">
                          НЕ НАЧАТО
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>

      {/* FOOTER NAV FOR MOBILE */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#051424]/90 backdrop-blur-2xl border-t border-white/10 flex justify-around items-center h-20 pb-safe md:hidden max-w-md mx-auto rounded-t-xl">
        <button 
          onClick={() => setActiveTab("study")}
          className={`flex flex-col items-center justify-center transition-all ${activeTab === "study" ? "text-[#00ff85]" : "text-[#b9cbb9]/60"}`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="font-mono text-[10px] mt-1.5 uppercase">Обучение</span>
        </button>
        <button 
          onClick={() => setActiveTab("prompts")}
          className={`flex flex-col items-center justify-center transition-all ${activeTab === "prompts" ? "text-[#00ff85]" : "text-[#b9cbb9]/60"}`}
        >
          <Terminal className="w-5 h-5" />
          <span className="font-mono text-[10px] mt-1.5 uppercase">Промпты</span>
        </button>
        <button 
          onClick={() => { setActiveTab("progress"); markStepComplete(currentStepIdx); }}
          className={`flex flex-col items-center justify-center transition-all ${activeTab === "progress" ? "text-[#00ff85]" : "text-[#b9cbb9]/60"}`}
        >
          <Activity className="w-5 h-5" />
          <span className="font-mono text-[10px] mt-1.5 uppercase">Прогресс</span>
        </button>
      </nav>

      {/* AI COACH SLIDEOUT PANEL / DRAWER */}
      {isCoachOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-[fadeIn_0.2s_ease-out]">
          {/* Backdrop */}
          <div onClick={() => setIsCoachOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
          
          {/* Panel */}
          <div className="relative w-full max-w-md h-full bg-[#051424] border-l border-[#00ff85]/30 flex flex-col z-10 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            
            {/* Header of Coach panel */}
            <div className="p-4 bg-[#0d1c2d] border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00ff85] animate-ping"></div>
                <Sparkles className="w-4 h-4 text-[#00ff85]" />
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">ИИ-Наставник (AI Coach)</span>
              </div>
              <button 
                onClick={() => setIsCoachOpen(false)} 
                className="p-1 rounded hover:bg-white/5 transition-colors text-[#b9cbb9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Idea helper banner inside coach */}
            <div className="px-4 py-2 bg-[#0c202a] border-b border-[#00ff85]/15 text-[10px] font-mono text-[#b9cbb9]">
              Контекст идеи: <span className="text-[#00ff85] italic font-semibold">"{userIdea.substring(0,45)}..."</span>
            </div>

            {/* Message lists */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#020b12]">
              {coachMessages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
                >
                  <span className="font-mono text-[9px] text-[#b9cbb9] mb-1">
                    {msg.role === "user" ? "Ты" : "ИИ-Наставник"}
                  </span>
                  <div className={`p-3 rounded-lg text-xs leading-relaxed leading-relaxed ${
                    msg.role === "user" ? "bg-[#00ff85]/10 text-white border border-[#00ff85]/30 rounded-tr-none" : "bg-[#0d1c2d] text-[#e2ede2] border border-white/10 rounded-tl-none whitespace-pre-wrap font-sans"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isCoachLoading && (
                <div className="flex flex-col max-w-[85%] items-start">
                  <span className="font-mono text-[9px] text-[#b9cbb9] mb-1">ИИ-Наставник</span>
                  <div className="p-3 rounded-lg text-xs bg-[#0d1c2d] text-[#00ff85] border border-white/10 rounded-tl-none font-mono animate-pulse">
                    обдумываю проектные метрики...
                  </div>
                </div>
              )}
              <div ref={coachEndRef} />
            </div>

            {/* Input form */}
            <div className="p-4 bg-[#0d1c2d] border-t border-white/10 flex gap-2">
              <input 
                type="text" 
                value={coachInput}
                onChange={(e) => setCoachInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendToCoach()}
                placeholder="Спросите совет или отправьте гипотезу..." 
                className="flex-grow bg-[#051424] border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00ff85]"
              />
              <button 
                onClick={handleSendToCoach}
                disabled={isCoachLoading}
                className="p-1.5 bg-[#00ff85] text-[#00210c] hover:bg-[#61ff97] rounded active:scale-95 transition-all text-xs font-mono font-bold shrink-0 flex items-center justify-center transition-colors disabled:opacity-45"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
