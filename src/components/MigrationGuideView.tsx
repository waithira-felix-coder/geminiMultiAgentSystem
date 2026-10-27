/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { CODELAB_STEPS } from "../data/codelabContent";
import {
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  Terminal,
  Code2,
  Sparkles,
} from "lucide-react";

export const MigrationGuideView: React.FC = () => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [copiedCodeSnippet, setCopiedCodeSnippet] = useState<string | null>(null);

  const step = CODELAB_STEPS[activeStepIndex];

  const handleCopy = (snippet: string, id: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedCodeSnippet(id);
    setTimeout(() => setCopiedCodeSnippet(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Codelab Hero Header */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Production-Ready AI Roadshow • Lab 1
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Vertex AI ➔ AI Studio Free Tier
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Building a Multi-Agent System on Google AI Studio
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              Complete migration walkthrough from Google Cloud Vertex AI to the free-tier Gemini API.
              Build autonomous collaborating agents (Researcher, Judge, Content Builder) without GCP billing setup.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://aistudio.google.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-blue-500/20"
            >
              <span>Get Free API Key</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 5-Step Horizontal Breadcrumbs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-8 pt-6 border-t border-slate-800">
          {CODELAB_STEPS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setActiveStepIndex(idx)}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeStepIndex === idx
                  ? "bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/10"
                  : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-400"
              }`}
            >
              <div className="flex items-center space-x-1.5 text-[11px] font-mono text-blue-400 mb-1">
                <span>STEP {s.stepNumber}</span>
              </div>
              <p className="text-xs font-semibold line-clamp-1 text-slate-200">
                {s.title.split("(")[0]}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Step Detail Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
        {/* Step Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-blue-500/20 text-blue-400">
                STEP {step.stepNumber} OF 5
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300">
                {step.badge}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {step.title}
            </h2>
            <p className="text-sm text-slate-300">{step.summary}</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              disabled={activeStepIndex === 0}
              onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
            >
              Previous
            </button>
            <button
              disabled={activeStepIndex === CODELAB_STEPS.length - 1}
              onClick={() => setActiveStepIndex((prev) => Math.min(CODELAB_STEPS.length - 1, prev + 1))}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Step Explanation Paragraphs */}
        <div className="space-y-3 text-sm text-slate-300 leading-relaxed bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80">
          {step.detailedExplanation.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {/* Side-by-Side Code Comparison (Vertex AI vs AI Studio) */}
        {step.vertexSnippet && step.aiStudioSnippet && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>Side-by-Side Code Migration Comparison</span>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Vertex AI Snippet */}
              <div className="rounded-2xl border border-red-900/40 bg-slate-950 overflow-hidden shadow-lg">
                <div className="flex items-center justify-between px-4 py-2.5 bg-red-950/30 border-b border-red-900/40">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-xs font-semibold text-red-300">
                      Google Cloud Vertex AI (Billing Required)
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(step.vertexSnippet!, `vertex-${step.id}`)}
                    className="text-slate-400 hover:text-slate-200 text-xs flex items-center space-x-1"
                  >
                    {copiedCodeSnippet === `vertex-${step.id}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
                  <code>{step.vertexSnippet}</code>
                </pre>
              </div>

              {/* AI Studio Snippet */}
              <div className="rounded-2xl border border-emerald-900/50 bg-slate-950 overflow-hidden shadow-lg">
                <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-950/30 border-b border-emerald-900/40">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-300">
                      Google AI Studio (100% Free Tier API Key)
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(step.aiStudioSnippet!, `aistudio-${step.id}`)}
                    className="text-slate-400 hover:text-slate-200 text-xs flex items-center space-x-1"
                  >
                    {copiedCodeSnippet === `aistudio-${step.id}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-emerald-200 overflow-x-auto leading-relaxed">
                  <code>{step.aiStudioSnippet}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Key Differences Table */}
        {step.keyDifferences && step.keyDifferences.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Key Architectural Comparison</span>
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Feature / Dimension</th>
                    <th className="py-3 px-4 text-red-300">Vertex AI (Cloud Shell Lab)</th>
                    <th className="py-3 px-4 text-emerald-300">Google AI Studio (Free Tier)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
                  {step.keyDifferences.map((diff, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-200">{diff.feature}</td>
                      <td className="py-3 px-4 text-slate-400">{diff.vertexAI}</td>
                      <td className="py-3 px-4 text-emerald-300 font-medium">{diff.aiStudio}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pro-Tips Box */}
        {step.proTips && step.proTips.length > 0 && (
          <div className="bg-blue-950/30 border border-blue-900/40 rounded-2xl p-5 space-y-2">
            <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Production Best Practices & Pro Tips</span>
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {step.proTips.map((tip, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <span className="text-blue-400 font-bold">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
