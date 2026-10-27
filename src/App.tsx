/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Navbar } from "./components/Navbar";
import { AgentGraph } from "./components/AgentGraph";
import { RefinementHistoryView } from "./components/RefinementHistoryView";
import { CourseContentView } from "./components/CourseContentView";
import { MigrationGuideView } from "./components/MigrationGuideView";
import { CodeExporterView } from "./components/CodeExporterView";
import {
  AgentExecutionEvent,
  CourseContent,
  IterationRecord,
  JudgeEvaluation,
  PipelineExecutionResult,
  ResearchDossier,
} from "./types";
import {
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Sliders,
  Terminal,
  BookOpen,
  Scale,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const PRESET_TOPICS = [
  {
    title: "Building Event-Driven Microservices with Apache Kafka & Node.js",
    audience: "Intermediate Backend Developers",
  },
  {
    title: "Full-Stack Vector Search with Postgres pgvector & Gemini Embeddings",
    audience: "Full-Stack Software Engineers",
  },
  {
    title: "Architecting Production Multi-Agent Systems on Google AI Studio",
    audience: "AI Engineers & Solutions Architects",
  },
  {
    title: "Zero-Knowledge Proofs in Practice: zk-SNARKs for Web3 Developers",
    audience: "Advanced Distributed Systems Engineers",
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"studio" | "guide" | "code">("studio");

  // Workflow Config Form
  const [topic, setTopic] = useState<string>(PRESET_TOPICS[0].title);
  const [audience, setAudience] = useState<string>(PRESET_TOPICS[0].audience);
  const [passingScore, setPassingScore] = useState<number>(80);
  const [maxIterations, setMaxIterations] = useState<number>(3);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [researcherInstructions, setResearcherInstructions] = useState<string>("");
  const [judgeNotes, setJudgeNotes] = useState<string>("");

  // Execution State
  const [status, setStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [currentAgent, setCurrentAgent] = useState<
    "researcher" | "judge" | "loop_orchestrator" | "content_builder" | undefined
  >();
  const [currentIteration, setCurrentIteration] = useState<number>(1);
  const [judgeScore, setJudgeScore] = useState<number | undefined>();
  const [isJudgePassed, setIsJudgePassed] = useState<boolean | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result State
  const [events, setEvents] = useState<{ timestamp: string; event: AgentExecutionEvent }[]>([]);
  const [history, setHistory] = useState<IterationRecord[]>([]);
  const [courseContent, setCourseContent] = useState<CourseContent | null>(null);
  const [activeStudioSubTab, setActiveStudioSubTab] = useState<"course" | "loop" | "logs">("course");

  const abortControllerRef = useRef<AbortController | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll logs
  useEffect(() => {
    if (activeStudioSubTab === "logs") {
      logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [events, activeStudioSubTab]);

  const handleLaunchWorkflow = async () => {
    if (!topic.trim()) return;

    setStatus("running");
    setErrorMessage(null);
    setEvents([]);
    setHistory([]);
    setCourseContent(null);
    setCurrentIteration(1);
    setCurrentAgent(undefined);
    setJudgeScore(undefined);
    setIsJudgePassed(undefined);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          audience,
          passingScore,
          maxIterations,
          researcherInstructions: researcherInstructions.trim() || undefined,
          judgeNotes: judgeNotes.trim() || undefined,
        }),
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      let currentDossier: ResearchDossier | null = null;
      let tempHistory: IterationRecord[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const dataStr = trimmed.slice(6);
          if (dataStr === "[DONE]") {
            setStatus("completed");
            break;
          }

          try {
            const event: AgentExecutionEvent = JSON.parse(dataStr);
            const timestamp = new Date().toLocaleTimeString();

            setEvents((prev) => [...prev, { timestamp, event }]);

            // Update Agent Graph and loop states
            if (event.type === "agent_start" && event.agent) {
              setCurrentAgent(event.agent);
            }

            if (event.iteration) {
              setCurrentIteration(event.iteration);
            }

            if (event.type === "agent_complete") {
              if (event.agent === "researcher" && event.data) {
                currentDossier = event.data as ResearchDossier;
              }
              if (event.agent === "judge" && event.data) {
                const evalData = event.data as JudgeEvaluation;
                setJudgeScore(evalData.totalScore);
                setIsJudgePassed(evalData.passed);

                if (currentDossier) {
                  const record: IterationRecord = {
                    iteration: event.iteration || currentIteration,
                    dossier: currentDossier,
                    evaluation: evalData,
                  };
                  tempHistory = [...tempHistory, record];
                  setHistory(tempHistory);
                }
              }
              if (event.agent === "content_builder" && event.data) {
                const course = event.data as CourseContent;
                setCourseContent(course);
                setActiveStudioSubTab("course");
              }
            }

            if (event.type === "pipeline_complete") {
              setStatus("completed");
              setCurrentAgent(undefined);
              if (event.data?.courseContent) {
                setCourseContent(event.data.courseContent);
              }
              if (event.data?.history) {
                setHistory(event.data.history);
              }
            }

            if (event.type === "error") {
              setStatus("error");
              setErrorMessage(event.message || "An error occurred during workflow execution.");
            }
          } catch (err) {
            console.error("Failed to parse SSE event:", err);
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        setStatus("idle");
        return;
      }
      console.error("Workflow failed:", err);
      setStatus("error");
      setErrorMessage(err.message || "Workflow execution failed");
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleStopWorkflow = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus("idle");
    setCurrentAgent(undefined);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isRunning={status === "running"}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {activeTab === "guide" && <MigrationGuideView />}

        {activeTab === "code" && <CodeExporterView />}

        {activeTab === "studio" && (
          <div className="space-y-8">
            {/* Control Panel + Configuration */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    <span>Multi-Agent System Control Deck</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Orchestrates Researcher ↔ Judge (LoopAgent) and Content Builder (SequentialAgent).
                  </p>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-slate-400 mr-1">Presets:</span>
                  {PRESET_TOPICS.map((p, i) => (
                    <button
                      key={i}
                      disabled={status === "running"}
                      onClick={() => {
                        setTopic(p.title);
                        setAudience(p.audience);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all disabled:opacity-50"
                    >
                      {p.title.split(":")[0].slice(0, 24)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Topic Input (7 cols) */}
                <div className="md:col-span-7 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Curriculum Topic or Technical System
                  </label>
                  <input
                    type="text"
                    value={topic}
                    disabled={status === "running"}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Building Event-Driven Microservices with Apache Kafka"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-60"
                  />
                </div>

                {/* Audience Input (5 cols) */}
                <div className="md:col-span-5 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Target Learner Level
                  </label>
                  <input
                    type="text"
                    value={audience}
                    disabled={status === "running"}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g. Intermediate Backend Developers"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-60"
                  />
                </div>

                {/* Passing Score Slider (6 cols) */}
                <div className="md:col-span-6 space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300">
                      Judge Passing Threshold:
                    </span>
                    <span className="font-mono font-bold text-purple-400">
                      {passingScore} / 100
                    </span>
                  </div>
                  <input
                    type="range"
                    min="65"
                    max="95"
                    step="5"
                    value={passingScore}
                    disabled={status === "running"}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer disabled:opacity-50"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Lenient (65)</span>
                    <span>Balanced (80)</span>
                    <span>Strict (95)</span>
                  </div>
                </div>

                {/* Max Iterations (6 cols) */}
                <div className="md:col-span-6 space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300">
                      Max Refinement Loops:
                    </span>
                    <span className="font-mono font-bold text-blue-400">
                      {maxIterations} Iterations
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={maxIterations}
                    disabled={status === "running"}
                    onChange={(e) => setMaxIterations(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer disabled:opacity-50"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Single-pass (1)</span>
                    <span>Standard (3)</span>
                    <span>Deep Refine (5)</span>
                  </div>
                </div>
              </div>

              {/* Advanced Prompting Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{showAdvanced ? "Hide" : "Show"} Custom Agent Prompt Instructions</span>
                  {showAdvanced ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {showAdvanced && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-blue-300">
                        Researcher Agent Directives
                      </label>
                      <textarea
                        rows={2}
                        value={researcherInstructions}
                        onChange={(e) => setResearcherInstructions(e.target.value)}
                        placeholder="e.g. Must include Docker compose setup and benchmarks..."
                        className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-purple-300">
                        Judge Agent Extra Rubric Criteria
                      </label>
                      <textarea
                        rows={2}
                        value={judgeNotes}
                        onChange={(e) => setJudgeNotes(e.target.value)}
                        placeholder="e.g. Heavily penalize any missing edge-case error handling..."
                        className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Launch Action Button */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="text-xs text-slate-400 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Zero-Billing Free Tier Mode • Gemini 3.8 Flash</span>
                </div>

                <div className="flex items-center space-x-3">
                  {status === "running" ? (
                    <button
                      onClick={handleStopWorkflow}
                      className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-all shadow-lg shadow-red-500/20"
                    >
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Abort Execution</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleLaunchWorkflow}
                      className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm transition-all shadow-xl shadow-blue-500/25 active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Execute Multi-Agent System</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-xs text-red-300 flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Execution Failed</span>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Visual Agent Graph Diagram */}
            <AgentGraph
              currentAgent={currentAgent}
              currentIteration={currentIteration}
              maxIterations={maxIterations}
              judgeScore={judgeScore}
              isJudgePassed={isJudgePassed}
              status={status}
            />

            {/* Results & Inspection Section */}
            {(courseContent || history.length > 0 || events.length > 0) && (
              <div className="space-y-4">
                {/* Sub-tab navigation */}
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                  {courseContent && (
                    <button
                      onClick={() => setActiveStudioSubTab("course")}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        activeStudioSubTab === "course"
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                          : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>Authored Course Material</span>
                    </button>
                  )}

                  {history.length > 0 && (
                    <button
                      onClick={() => setActiveStudioSubTab("loop")}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        activeStudioSubTab === "loop"
                          ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                          : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                      }`}
                    >
                      <Scale className="w-4 h-4" />
                      <span>Refinement Loop & Rubrics ({history.length})</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveStudioSubTab("logs")}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      activeStudioSubTab === "logs"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                    }`}
                  >
                    <Terminal className="w-4 h-4" />
                    <span>Agent Telemetry & Logs ({events.length})</span>
                  </button>
                </div>

                {/* Sub-tab views */}
                {activeStudioSubTab === "course" && courseContent && (
                  <CourseContentView course={courseContent} />
                )}

                {activeStudioSubTab === "loop" && (
                  <RefinementHistoryView history={history} passingScore={passingScore} />
                )}

                {activeStudioSubTab === "logs" && (
                  <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                        <Terminal className="w-4 h-4 text-emerald-400" />
                        <span>Live Event Stream (SSE)</span>
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {events.length} events logged
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 font-mono text-xs">
                      {events.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/80 flex items-start space-x-3"
                        >
                          <span className="text-slate-400 text-[10px] shrink-0 mt-0.5">
                            {item.timestamp}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                              item.event.agent === "researcher"
                                ? "bg-blue-500/20 text-blue-400"
                                : item.event.agent === "judge"
                                ? "bg-purple-500/20 text-purple-400"
                                : item.event.agent === "content_builder"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {item.event.agent ? item.event.agent.toUpperCase() : item.event.type}
                          </span>
                          <p className="text-slate-300 leading-relaxed">
                            {item.event.message || JSON.stringify(item.event.data || {})}
                          </p>
                        </div>
                      ))}
                      <div ref={logEndRef} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Google Cloud Roadshow Lab 1 • Re-architected for Google AI Studio Free Tier
          </p>
          <div className="flex items-center space-x-4">
            <span className="text-slate-400">Powered by</span>
            <span className="font-semibold text-slate-300">Gemini 3.8 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
