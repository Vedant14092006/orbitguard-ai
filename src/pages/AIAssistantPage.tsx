import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Trash2,
  Download,
  ShieldAlert,
  Activity,
  User,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  BookOpen,
  HelpCircle,
  ShieldCheck,
  Terminal,
  Cpu
} from 'lucide-react';
import { ChatMessage } from '../types/orbit';
import { queryAstraAssistant } from '../services/aiAssistantService';
import { audioService } from '../services/audioService';
import { Badge } from '../components/common/Badge';
import { NavPage } from '../components/layout/Sidebar';

interface AIAssistantPageProps {
  initialPrompt?: string | null;
  onNavigateToPage?: (page: NavPage, objectId?: string) => void;
}

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({
  initialPrompt,
  onNavigateToPage
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      sender: 'astra',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      text: `### ASTRA FLIGHT DIRECTOR ONLINE // SYSTEM INITIALIZATION COMPLETE

Greetings, Flight Dynamics Officer. I am **ASTRA** (Aerospace Sustainability & Trajectory Risk Analyst), your dedicated AI space assistant for **ORBITGUARD AI**.

I provide real-time guidance across:
- **Orbital Debris & Hypervelocity Physics:** Mechanics, kinetic impact energy ($E_k = \\frac{1}{2}mv^2$), and tracking limits.
- **Collision Risk & Avoidance Maneuvers:** Conjunction Data Message (CDM) analysis, B-plane covariance, and $\\Delta V$ burn calculations.
- **Space Sustainability & Regulation:** Space Sustainability Rating (SSR), 5-year post-mission deorbit rules, and Design for Demise (D4D).
- **Kessler Syndrome Modeling:** Runaway cascade dynamics and Active Debris Removal (ADR) target prioritization.

Click any suggested question chip below or type your query in the terminal.`,
      dataCard: {
        title: 'Mission Surveillance Context',
        metrics: [
          { label: 'Active Satellites', value: '7,420 Tracked', status: 'good' },
          { label: 'Cataloged Debris', value: '36,500 Objects', status: 'warn' },
          { label: 'Critical CDMs', value: '1 Immediate (Starlink)', status: 'crit' },
          { label: 'AI Engine Mode', value: 'ASTRA Neural Copilot', status: 'good' }
        ],
        recommendation: 'ASTRA READY FOR CONJUNCTION SCREENING & SAFETY AUDIT INQUIRIES'
      }
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [promptCategory, setPromptCategory] = useState<'ALL' | 'DEBRIS' | 'COLLISION' | 'SUSTAINABILITY' | 'DASHBOARD'>('ALL');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // All 8 Core User Questions + Specialized Action Chips
  const allSuggestedPrompts = [
    { label: 'What is space debris?', category: 'DEBRIS', prompt: 'What is space debris?' },
    { label: 'Why is orbital debris dangerous?', category: 'DEBRIS', prompt: 'Why is orbital debris dangerous?' },
    { label: 'Highest collision risk satellites?', category: 'COLLISION', prompt: 'Which satellites have the highest simulated collision risk?' },
    { label: 'How satellites avoid collisions?', category: 'COLLISION', prompt: 'How can satellites avoid collisions?' },
    { label: 'What is Kessler Syndrome?', category: 'DEBRIS', prompt: 'What is Kessler Syndrome?' },
    { label: 'How to reduce orbital pollution?', category: 'SUSTAINABILITY', prompt: 'How can we reduce orbital pollution?' },
    { label: 'Sustainable satellite disposal?', category: 'SUSTAINABILITY', prompt: 'What are sustainable satellite disposal practices?' },
    { label: 'Explain the current dashboard', category: 'DASHBOARD', prompt: 'Explain the current orbital risk dashboard.' },
    { label: 'Summarize report CDM-2026-001', category: 'COLLISION', prompt: 'Summarize active collision report CDM-2026-001.' }
  ];

  const visiblePrompts = allSuggestedPrompts.filter(p => promptCategory === 'ALL' || p.category === promptCategory);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const speakText = (text: string) => {
    if (!isVoiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      // Clean markdown tags for natural speech
      const clean = text.replace(/[#*`_$\\]/g, ' ').substring(0, 320);
      const utter = new SpeechSynthesisUtterance(clean);
      utter.rate = 1.05;
      utter.pitch = 0.95;
      window.speechSynthesis.speak(utter);
    } catch {
      // Ignore speech synthesis errors
    }
  };

  const handleSend = async (promptText?: string) => {
    const textToSend = promptText || inputPrompt;
    if (!textToSend.trim()) return;

    audioService.playBlip();

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsTyping(true);

    try {
      const response = await queryAstraAssistant(textToSend);
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
      audioService.playBlip();
      speakText(response.text);
    } catch {
      setIsTyping(false);
    }
  };

  const initialHandledRef = useRef(false);
  useEffect(() => {
    if (initialPrompt && !initialHandledRef.current) {
      initialHandledRef.current = true;
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    audioService.playBlip();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([]);
    audioService.playBlip();
  };

  const handleExportChat = () => {
    const transcript = messages.map(m => `[${m.timestamp}] ${m.sender.toUpperCase()}:\n${m.text}\n\n`).join('---\n\n');
    const blob = new Blob([transcript], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ASTRA_Mission_Transcript_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    audioService.playSuccess();
  };

  return (
    <div className="space-y-4 font-mono pb-16">
      {/* Top Banner Header */}
      <div className="rounded-xl border border-purple-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base font-bold text-slate-100 uppercase tracking-wider">
                ASTRA // AI Space Traffic & Sustainability Director
              </h1>
              <Badge label="SECURE BACKEND LLM READY" variant="purple" />
              <Badge label="LOCAL KNOWLEDGE ENGINE ACTIVE" variant="emerald" />
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Autonomous conversational agent specialized in space sustainability, orbital debris mechanics, and collision risk avoidance.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            className={`p-2 rounded-lg border transition-colors ${
              isVoiceEnabled
                ? 'bg-purple-950 border-purple-500/50 text-purple-300'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={isVoiceEnabled ? 'Voice Synthesis Active' : 'Voice Synthesis Muted'}
          >
            {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={handleExportChat}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Export Mission Transcript (.md)"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleClearChat}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 transition-colors"
            title="Clear Chat Stream"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Safety Notice & Cross-Console Quick Links */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] px-3.5 py-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Data Integrity Assurance:</strong> ASTRA evaluates real-world orbital physics and verified catalog metrics. Simulated test assets are explicitly labeled. Real operational burns require certified 18 SDS state vectors.
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onNavigateToPage?.('tracker')}
            className="px-2 py-0.5 rounded bg-slate-950 border border-cyan-500/30 text-cyan-400 hover:text-cyan-200 text-[10px] transition-colors"
          >
            3D Tracker
          </button>
          <button
            onClick={() => onNavigateToPage?.('collision-risk')}
            className="px-2 py-0.5 rounded bg-slate-950 border border-red-500/30 text-red-400 hover:text-red-200 text-[10px] transition-colors"
          >
            Collisions
          </button>
          <button
            onClick={() => onNavigateToPage?.('sustainability')}
            className="px-2 py-0.5 rounded bg-slate-950 border border-emerald-500/30 text-emerald-400 hover:text-emerald-200 text-[10px] transition-colors"
          >
            Sustainability
          </button>
        </div>
      </div>

      {/* Main Chat Stream Container */}
      <div className="rounded-xl border border-cyan-500/30 bg-slate-900/60 backdrop-blur-md flex flex-col h-[640px] overflow-hidden shadow-2xl">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isAstra = msg.sender === 'astra';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs ${isAstra ? 'justify-start' : 'justify-end'}`}
              >
                {isAstra && (
                  <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-400 flex items-center justify-center shrink-0 mt-1 shadow-md">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-xl p-4 border leading-relaxed space-y-3 relative group ${
                    isAstra
                      ? 'bg-slate-950/90 border-slate-800 text-slate-200 shadow-md'
                      : 'bg-gradient-to-r from-cyan-950 to-blue-950 border-cyan-500/40 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-800/80 pb-1.5 mb-2">
                    <span className="font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                      {isAstra ? (
                        <>
                          <Cpu className="w-3.5 h-3.5 text-purple-400" />
                          <span>ASTRA FLIGHT DIRECTOR</span>
                        </>
                      ) : (
                        <>
                          <User className="w-3.5 h-3.5 text-cyan-400" />
                          <span>OPERATIONS OFFICER</span>
                        </>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{msg.timestamp}</span>
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.text)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-cyan-300"
                        title="Copy message text"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Message Body Content */}
                  <div className="whitespace-pre-line text-xs font-mono space-y-1.5 leading-relaxed">
                    {msg.text}
                  </div>

                  {/* Telemetry Data Card if present */}
                  {msg.dataCard && (
                    <div className="mt-3 p-3.5 rounded-lg bg-slate-900/90 border border-cyan-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-slate-300 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-cyan-400" />
                          {msg.dataCard.title}
                        </span>
                        <span className="text-[9px] text-emerald-400 font-mono">ASTRO-VERIFIED METRICS</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        {msg.dataCard.metrics.map((m, idx) => (
                          <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-800">
                            <span className="text-[9px] text-slate-500 block">{m.label}</span>
                            <strong
                              className={
                                m.status === 'crit'
                                  ? 'text-red-400 font-bold'
                                  : m.status === 'warn'
                                  ? 'text-amber-400 font-bold'
                                  : 'text-emerald-400 font-bold'
                              }
                            >
                              {m.value}
                            </strong>
                          </div>
                        ))}
                      </div>

                      {msg.dataCard.recommendation && (
                        <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-500/30 text-[10px] text-emerald-300 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>RECOMMENDATION: {msg.dataCard.recommendation}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!isAstra && (
                  <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-purple-400 animate-pulse font-mono pl-11">
              <Bot className="w-4 h-4" />
              <span>ASTRA is parsing astrodynamics telemetry and calculating orbital physics...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggested Questions & Category Filter Chips */}
        <div className="border-t border-slate-800 bg-slate-950/90 p-2.5 space-y-2">
          {/* Category Filter Tabs */}
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              Suggested Questions:
            </span>
            <div className="flex items-center gap-1">
              {(['ALL', 'DEBRIS', 'COLLISION', 'SUSTAINABILITY', 'DASHBOARD'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setPromptCategory(cat)}
                  className={`px-2 py-0.5 rounded transition-all font-bold ${
                    promptCategory === cat
                      ? 'bg-purple-950 text-purple-300 border border-purple-500/50'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Prompt Chips Carousel */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-thin">
            {visiblePrompts.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(item.prompt)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-purple-300 transition-all whitespace-nowrap text-[11px] flex items-center gap-1.5"
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input Box */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Ask ASTRA anything (e.g. 'What is space debris?', 'How to avoid collisions?', 'Explain Kessler Syndrome')..."
            className="flex-1 px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputPrompt.trim() || isTyping}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">TRANSMIT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
