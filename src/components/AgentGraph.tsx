/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  Search,
  Scale,
  Sparkles,
  ArrowRight,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Layers,
} from "lucide-react";

interface AgentGraphProps {
  currentAgent?: "researcher" | "judge" | "loop_orchestrator" | "content_builder";
  currentIteration?: number;
  maxIterations?: number;
  judgeScore?: number;
  isJudgePassed?: boolean;
  status: "idle" | "running" | "completed" | "error";
}

export const AgentGraph: React.FC<AgentGraphProps> = ({
  currentAgent,
  currentIteration = 1,
  maxIterations = 3,
  judgeScore,
  isJudgePassed,
  status,
}) => {
  const isResearcherActive = currentAgent === "researcher";
  const isJudgeActive = currentAgent === "judge";
  const isContentBuilderActive = currentAgent === "content_builder";
  const isLoopActive = currentAgent === "loop_orchestrator" || isResearcherActive || isJudgeActive;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Background grid accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b border-slate-800 relative z-10">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            Multi-Agent Architecture Flow
          </h3>
          <span className="text-xs text-slate-400">
            (LoopAgent & SequentialAgent)
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
            <RotateCw className={`w-3.5 h-3.5 ${isLoopActive && status === "running" ? "animate-spin text-blue-400" : "text-slate-400"}`} />
            <span className="text-slate-400">Refinement Loop:</span>
            <span className="font-mono font-medium text-slate-200">
              Iter {currentIteration}/{maxIterations}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
            <span className="text-slate-400">Status:</span>
            <span
              className={`font-medium ${
                status === "running"
                  ? "text-amber-400"
                  : status === "completed"
                  ? "text-emerald-400"
                  : status === "error"
                  ? "text-red-400"
                  : "text-slate-400"
              }`}
            >
              {status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Diagram Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center relative z-10">
        {/* Step 0: Input */}
        <div className="md:col-span-2 flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center mb-1 text-slate-300">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-200">User Spec</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Topic & Audience</span>
        </div>

        {/* Transition Arrow 1 */}
        <div className="hidden md:flex md:col-span-1 justify-center">
          <ArrowRight className="w-5 h-5 text-slate-600" />
        </div>

        {/* LoopAgent Container (Researcher <-> Judge) */}
        <div className="md:col-span-5 relative p-4 rounded-xl bg-slate-950/80 border border-blue-900/40 shadow-inner">
          <div className="absolute -top-2.5 left-4 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950 text-blue-300 border border-blue-800/80 flex items-center space-x-1">
            <RotateCw className="w-2.5 h-2.5" />
            <span>LoopAgent (Iterative Refinement)</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-1">
            {/* Researcher Node */}
            <div
              className={`p-3 rounded-lg border transition-all ${
                isResearcherActive
                  ? "bg-blue-950/70 border-blue-500 shadow-md shadow-blue-500/20 agent-active-glow"
                  : "bg-slate-900 border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-7 h-7 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Search className="w-3.5 h-3.5" />
                </div>
                {isResearcherActive && (
                  <span className="text-[10px] font-mono text-blue-400 animate-pulse">
                    Thinking...
                  </span>
                )}
              </div>
              <h4 className="text-xs font-semibold text-slate-200">Researcher</h4>
              <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                Topic decomposition, syllabus & prerequisites
              </p>
            </div>

            {/* Judge Node */}
            <div
              className={`p-3 rounded-lg border transition-all ${
                isJudgeActive
                  ? "bg-purple-950/70 border-purple-500 shadow-md shadow-purple-500/20 agent-active-glow"
                  : "bg-slate-900 border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-7 h-7 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Scale className="w-3.5 h-3.5" />
                </div>
                {judgeScore !== undefined && (
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isJudgePassed
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}
                  >
                    {judgeScore}/100
                  </span>
                )}
              </div>
              <h4 className="text-xs font-semibold text-slate-200">Judge Agent</h4>
              <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                Rubric grading & actionable critique
              </p>
            </div>
          </div>

          {/* Feedback arrow caption */}
          <div className="mt-2 text-[10px] text-slate-400 text-center flex items-center justify-center space-x-1">
            <span className="text-slate-500">Feedback Loop:</span>
            <span>Researcher drafts</span>
            <span className="text-slate-600">➔</span>
            <span>Judge critiques</span>
            <span className="text-slate-600">➔</span>
            <span>Refine if score &lt; pass</span>
          </div>
        </div>

        {/* Transition Arrow 2 */}
        <div className="hidden md:flex md:col-span-1 justify-center">
          <ArrowRight className="w-5 h-5 text-slate-600" />
        </div>

        {/* Content Builder Node */}
        <div
          className={`md:col-span-3 p-3.5 rounded-xl border transition-all ${
            isContentBuilderActive
              ? "bg-emerald-950/70 border-emerald-500 shadow-md shadow-emerald-500/20 agent-active-glow"
              : status === "completed"
              ? "bg-slate-950 border-emerald-800/80"
              : "bg-slate-950 border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-7 h-7 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            {isContentBuilderActive ? (
              <span className="text-[10px] font-mono text-emerald-400 animate-pulse">
                Authoring...
              </span>
            ) : status === "completed" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : null}
          </div>
          <h4 className="text-xs font-semibold text-slate-200">Content Builder</h4>
          <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
            Full theory, working code walkthroughs, exercises & quiz
          </p>
        </div>
      </div>
    </div>
  );
};
