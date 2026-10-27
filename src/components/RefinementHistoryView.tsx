/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { IterationRecord } from "../types";
import {
  CheckCircle2,
  XCircle,
  Scale,
  Search,
  MessageSquare,
  Sparkles,
  ChevronRight,
  BookOpen,
  Code2,
  AlertTriangle,
} from "lucide-react";

interface RefinementHistoryViewProps {
  history: IterationRecord[];
  passingScore?: number;
}

export const RefinementHistoryView: React.FC<RefinementHistoryViewProps> = ({
  history,
  passingScore = 80,
}) => {
  const [selectedIterIndex, setSelectedIterIndex] = useState<number>(
    history.length > 0 ? history.length - 1 : 0
  );

  if (!history || history.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <Scale className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <p className="text-sm">No refinement iterations recorded yet.</p>
        <p className="text-xs text-slate-400 mt-1">
          Launch a multi-agent run to observe the Researcher ↔ Judge loop in real-time.
        </p>
      </div>
    );
  }

  const currentRecord = history[selectedIterIndex] || history[0];
  const { iteration, dossier, evaluation } = currentRecord;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Top Bar: Iteration Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
            <Scale className="w-4 h-4 text-purple-400" />
            <span>Refinement Loop History</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare each iteration to see how the Judge's feedback shaped the Researcher's revisions.
          </p>
        </div>

        {/* Iteration Pills */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {history.map((rec, idx) => (
            <button
              key={rec.iteration}
              onClick={() => setSelectedIterIndex(idx)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedIterIndex === idx
                  ? "bg-purple-600 text-white shadow-sm shadow-purple-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <span>Iteration {rec.iteration}</span>
              {rec.evaluation.passed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="font-mono text-[11px] opacity-80">
                ({rec.evaluation.totalScore})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Judge Scorecard & Researcher Draft */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Judge Scorecard (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Judge Evaluation
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                  evaluation.passed
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                }`}
              >
                {evaluation.passed ? "APPROVED" : "REVISION REQUIRED"}
              </span>
            </div>

            {/* Total Score Display */}
            <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-slate-800">
              <span className="text-slate-400 text-xs">Total Quality Score</span>
              <div className="flex items-baseline space-x-1">
                <span
                  className={`text-3xl font-extrabold font-mono ${
                    evaluation.passed ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {evaluation.totalScore}
                </span>
                <span className="text-slate-400 text-xs">/ 100</span>
                <span className="text-[10px] text-slate-400 ml-2">
                  (Min Pass: {passingScore})
                </span>
              </div>
            </div>

            {/* Rubric Breakdown Bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Completeness & Breadth</span>
                  <span className="font-mono">{evaluation.completenessScore}/25</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(evaluation.completenessScore / 25) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Pedagogical Flow</span>
                  <span className="font-mono">{evaluation.pedagogicalScore}/25</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(evaluation.pedagogicalScore / 25) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Actionability & Code Depth</span>
                  <span className="font-mono">{evaluation.actionabilityScore}/25</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(evaluation.actionabilityScore / 25) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Clarity & Audience Calibration</span>
                  <span className="font-mono">{evaluation.clarityScore}/25</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(evaluation.clarityScore / 25) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Feedback Box */}
          <div className="bg-slate-950 rounded-xl p-4 border border-purple-900/40">
            <div className="flex items-center space-x-2 text-xs font-semibold text-purple-300 mb-2">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Judge's Actionable Feedback to Researcher</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed italic bg-purple-950/20 p-3 rounded-lg border border-purple-900/30">
              "{evaluation.actionableFeedback}"
            </p>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="space-y-3">
            {evaluation.strengths && evaluation.strengths.length > 0 && (
              <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800">
                <span className="text-xs font-semibold text-emerald-400 flex items-center mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Strengths
                </span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {evaluation.strengths.map((str, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-emerald-500 mr-1.5">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {evaluation.weaknesses && evaluation.weaknesses.length > 0 && (
              <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800">
                <span className="text-xs font-semibold text-amber-400 flex items-center mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Weaknesses Identified
                </span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {evaluation.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-amber-500 mr-1.5">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Researcher's Draft for this Iteration (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-blue-400 flex items-center space-x-1.5">
                <Search className="w-3.5 h-3.5" />
                <span>Researcher's Proposed Curriculum (Iteration {iteration})</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {dossier.keyModules.length} Modules Planned
              </span>
            </div>

            <div className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 mb-4">
              <span className="font-semibold text-slate-200">Architectural Summary: </span>
              {dossier.researchSummary}
            </div>

            {/* Prerequisites & Objectives */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Prerequisites
                </span>
                <ul className="space-y-1 text-xs text-slate-400">
                  {dossier.prerequisites.map((p, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-blue-500 mr-1.5">›</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Learning Objectives
                </span>
                <ul className="space-y-1 text-xs text-slate-400">
                  {dossier.learningObjectives.map((obj, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-emerald-500 mr-1.5">›</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Module Breakdown List */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                Planned Syllabus Modules
              </span>
              {dossier.keyModules.map((m) => (
                <div
                  key={m.moduleNumber}
                  className="bg-slate-900/70 p-3 rounded-lg border border-slate-800/80 space-y-1.5"
                >
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400">
                      M{m.moduleNumber}
                    </span>
                    <h5 className="text-xs font-semibold text-slate-200">
                      {m.title}
                    </h5>
                  </div>
                  <p className="text-xs text-slate-400 leading-normal">
                    {m.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-1">
                    {m.keyConcepts.map((kc, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300"
                      >
                        {kc}
                      </span>
                    ))}
                  </div>

                  <div className="text-[11px] text-cyan-400/90 bg-cyan-950/20 px-2 py-1 rounded border border-cyan-900/30">
                    <span className="font-semibold text-cyan-300">Hands-on: </span>
                    {m.handsOnActivityIdea}
                  </div>
                </div>
              ))}
            </div>

            {/* Pitfalls & Code Examples */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800">
              <div>
                <span className="text-[11px] font-semibold text-amber-400 flex items-center mb-1.5">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Technical Gotchas
                </span>
                <ul className="space-y-1 text-xs text-slate-400">
                  {dossier.technicalPitfalls.map((pit, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-amber-500 mr-1.5">•</span>
                      <span>{pit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-blue-400 flex items-center mb-1.5">
                  <Code2 className="w-3 h-3 mr-1" /> Code Scenarios Included
                </span>
                <ul className="space-y-1 text-xs text-slate-400">
                  {dossier.codeExamplesToInclude.map((cs, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-blue-500 mr-1.5">•</span>
                      <span>{cs}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
