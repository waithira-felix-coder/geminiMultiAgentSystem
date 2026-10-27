/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { CourseContent, CourseModule } from "../types";
import {
  BookOpen,
  Clock,
  Users,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  Download,
  GraduationCap,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Eye,
  FileCode2,
  Terminal,
} from "lucide-react";

interface CourseContentViewProps {
  course: CourseContent;
}

export const CourseContentView: React.FC<CourseContentViewProps> = ({ course }) => {
  const [activeModuleIndex, setActiveModuleIndex] = useState<number>(0);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [revealedSolutions, setRevealedSolutions] = useState<Record<number, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [copiedAll, setCopiedAll] = useState(false);

  const activeModule: CourseModule | undefined = course.modules[activeModuleIndex];

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const toggleSolution = (modIdx: number) => {
    setRevealedSolutions((prev) => ({
      ...prev,
      [modIdx]: !prev[modIdx],
    }));
  };

  const handleAnswerQuiz = (qIdx: number, optIdx: number) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [qIdx]: optIdx,
    }));
  };

  const exportAsMarkdown = () => {
    let md = `# ${course.courseTitle}\n\n`;
    md += `> ${course.tagline}\n\n`;
    md += `**Target Audience:** ${course.targetAudience} | **Estimated Completion:** ${course.estimatedCompletionHours} Hours\n\n`;
    md += `## Prerequisites\n${course.prerequisites.map((p) => `- ${p}`).join("\n")}\n\n`;

    md += `## Course Modules\n\n`;
    course.modules.forEach((mod) => {
      md += `### Module ${mod.moduleNumber}: ${mod.title} (${mod.durationMinutes} mins)\n\n`;
      md += `#### Conceptual Theory\n${mod.conceptualTheory}\n\n`;
      md += `#### Code Walkthrough: ${mod.codeWalkthrough.fileName} (${mod.codeWalkthrough.language})\n`;
      md += "```" + mod.codeWalkthrough.language + "\n" + mod.codeWalkthrough.code + "\n```\n\n";
      md += `*Explanation:* ${mod.codeWalkthrough.explanation}\n\n`;
      md += `#### Practical Exercise\n${mod.exercise.prompt}\n\n`;
      if (mod.exercise.hints.length) {
        md += `*Hints:*\n${mod.exercise.hints.map((h) => `- ${h}`).join("\n")}\n\n`;
      }
      if (mod.exercise.solutionSnippet) {
        md += `*Solution Snippet:*\n\`\`\`\n${mod.exercise.solutionSnippet}\n\`\`\`\n\n`;
      }
      md += `**Key Takeaway:** ${mod.keyTakeaway}\n\n---\n\n`;
    });

    md += `## Diagnostic Self-Assessment Quiz\n\n`;
    course.quiz.forEach((q, i) => {
      md += `**Q${i + 1}: ${q.question}**\n`;
      q.options.forEach((opt, oi) => {
        md += `${oi === q.correctAnswerIndex ? "- [x]" : "- [ ]"} ${opt}\n`;
      });
      md += `\n*Explanation:* ${q.explanation}\n\n`;
    });

    md += `## Capstone Project: ${course.capstoneProject.title}\n\n`;
    md += `${course.capstoneProject.description}\n\n`;
    md += `### Deliverables\n${course.capstoneProject.deliverables.map((d) => `- ${d}`).join("\n")}\n`;

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${course.courseTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsJSON = () => {
    const blob = new Blob([JSON.stringify(course, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${course.courseTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyAllText = () => {
    navigator.clipboard.writeText(JSON.stringify(course, null, 2));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-8">
      {/* Course Banner Header */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/40 p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center">
                <Sparkles className="w-3 h-3 mr-1" />
                Authored by Multi-Agent System
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {course.modules.length} Modules • {course.estimatedCompletionHours} hrs
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {course.courseTitle}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              {course.tagline}
            </p>
          </div>

          {/* Export Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportAsMarkdown}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm"
              title="Download as Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Markdown</span>
            </button>
            <button
              onClick={exportAsJSON}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700"
              title="Download as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
            <button
              onClick={copyAllText}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Metadata Pill Row */}
        <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-300">
          <div className="flex items-center space-x-1.5">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-slate-400">Audience:</span>
            <span className="font-medium text-slate-200">{course.targetAudience}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">Pace:</span>
            <span className="font-medium text-slate-200">
              ~{course.estimatedCompletionHours} Hours Hands-on
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Prerequisites:</span>
            <div className="flex flex-wrap gap-1">
              {course.prerequisites.map((p, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 border border-slate-700/60"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Module Selector Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>Interactive Modules</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Module {activeModuleIndex + 1} of {course.modules.length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {course.modules.map((mod, idx) => (
            <button
              key={mod.moduleNumber}
              onClick={() => setActiveModuleIndex(idx)}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeModuleIndex === idx
                  ? "bg-blue-950/80 border-blue-500 shadow-md shadow-blue-500/20"
                  : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    activeModuleIndex === idx
                      ? "bg-blue-500 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  M{mod.moduleNumber}
                </span>
                <span className="text-[10px] text-slate-400">{mod.durationMinutes}m</span>
              </div>
              <p
                className={`text-xs font-semibold line-clamp-1 ${
                  activeModuleIndex === idx ? "text-slate-100" : "text-slate-300"
                }`}
              >
                {mod.title}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Active Module Detail */}
      {activeModule && (
        <div className="bg-slate-950 rounded-2xl p-5 sm:p-7 border border-slate-800 space-y-6">
          {/* Module Heading */}
          <div className="border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-400 mb-1">
              <span>MODULE {activeModule.moduleNumber}</span>
              <span>•</span>
              <span className="text-slate-400">{activeModule.durationMinutes} MIN READ & CODE</span>
            </div>
            <h4 className="text-xl font-bold text-white tracking-tight">
              {activeModule.title}
            </h4>
          </div>

          {/* Theory Section */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>Conceptual Theory & Deep Dive</span>
            </h5>
            <div className="text-sm text-slate-300 leading-relaxed space-y-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
              {activeModule.conceptualTheory.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>

          {/* Code Walkthrough */}
          {activeModule.codeWalkthrough && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                  <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Production Code Walkthrough</span>
                </h5>
                <span className="text-xs text-slate-400 font-mono">
                  {activeModule.codeWalkthrough.fileName}
                </span>
              </div>

              {/* Code Editor Container */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-xs font-mono text-slate-300 ml-2">
                      {activeModule.codeWalkthrough.fileName}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      handleCopyCode(
                        activeModule.codeWalkthrough.code,
                        `mod-${activeModule.moduleNumber}`
                      )
                    }
                    className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {copiedCodeId === `mod-${activeModule.moduleNumber}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                  <code>{activeModule.codeWalkthrough.code}</code>
                </pre>
              </div>

              <p className="text-xs text-slate-400 italic px-1">
                {activeModule.codeWalkthrough.explanation}
              </p>
            </div>
          )}

          {/* Hands-On Exercise */}
          {activeModule.exercise && (
            <div className="bg-slate-900/50 rounded-xl p-4 border border-blue-900/30 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Hands-on Lab Exercise</span>
                </h5>
                <button
                  onClick={() => toggleSolution(activeModule.moduleNumber)}
                  className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>
                    {revealedSolutions[activeModule.moduleNumber]
                      ? "Hide Solution"
                      : "Reveal Solution"}
                  </span>
                </button>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed">
                {activeModule.exercise.prompt}
              </p>

              {activeModule.exercise.hints && activeModule.exercise.hints.length > 0 && (
                <div className="text-xs text-slate-400 space-y-1">
                  <span className="font-semibold text-slate-300">Hints:</span>
                  <ul className="list-disc list-inside space-y-0.5 ml-1">
                    {activeModule.exercise.hints.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              {revealedSolutions[activeModule.moduleNumber] &&
                activeModule.exercise.solutionSnippet && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400">
                    <span className="text-[10px] text-slate-400 block mb-1">
                      Solution Snippet:
                    </span>
                    <pre className="overflow-x-auto">
                      <code>{activeModule.exercise.solutionSnippet}</code>
                    </pre>
                  </div>
                )}
            </div>
          )}

          {/* Key Takeaway Card */}
          <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-3.5 text-xs text-emerald-300 flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-emerald-200">Key Takeaway</span>
              <span>{activeModule.keyTakeaway}</span>
            </div>
          </div>
        </div>
      )}

      {/* Diagnostic Quiz Section */}
      {course.quiz && course.quiz.length > 0 && (
        <div className="bg-slate-950 rounded-2xl p-5 sm:p-7 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-base font-bold text-white flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-purple-400" />
              <span>Diagnostic Self-Assessment Quiz</span>
            </h4>
            <span className="text-xs text-slate-400">
              Interactive Concept Check ({course.quiz.length} Questions)
            </span>
          </div>

          <div className="space-y-6">
            {course.quiz.map((q, qIdx) => {
              const selectedOpt = quizAnswers[qIdx];
              const isAnswered = selectedOpt !== undefined;
              const isCorrect = isAnswered && selectedOpt === q.correctAnswerIndex;

              return (
                <div
                  key={qIdx}
                  className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-3"
                >
                  <p className="text-sm font-semibold text-slate-100">
                    {qIdx + 1}. {q.question}
                  </p>

                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      let btnStyle = "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700";

                      if (isAnswered) {
                        if (optIdx === q.correctAnswerIndex) {
                          btnStyle = "bg-emerald-950/60 border-emerald-500 text-emerald-200";
                        } else if (selectedOpt === optIdx) {
                          btnStyle = "bg-red-950/60 border-red-500 text-red-200";
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={isAnswered}
                          onClick={() => handleAnswerQuiz(qIdx, optIdx)}
                          className={`w-full text-left p-3 rounded-lg border text-xs font-medium transition-all flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isAnswered && optIdx === q.correctAnswerIndex && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isAnswered && (
                    <div
                      className={`text-xs p-3 rounded-lg border ${
                        isCorrect
                          ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-300"
                          : "bg-amber-950/30 border-amber-800/60 text-amber-300"
                      }`}
                    >
                      <span className="font-bold block mb-0.5">
                        {isCorrect ? "✓ Correct!" : "✗ Review Needed"}
                      </span>
                      <span>{q.explanation}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Capstone Project Section */}
      {course.capstoneProject && (
        <div className="bg-gradient-to-r from-blue-950/30 to-purple-950/30 rounded-2xl p-5 sm:p-7 border border-blue-900/40 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" />
            <span>Capstone Project Brief</span>
          </div>
          <h4 className="text-lg font-bold text-white">
            {course.capstoneProject.title}
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {course.capstoneProject.description}
          </p>

          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-200 block mb-2">
              Deliverables Required:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {course.capstoneProject.deliverables.map((del, i) => (
                <div
                  key={i}
                  className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-start space-x-2"
                >
                  <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span>{del}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
