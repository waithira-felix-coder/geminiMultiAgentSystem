/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Code2,
  Copy,
  Check,
  Download,
  Terminal,
  FileCode2,
  ExternalLink,
  Sparkles,
} from "lucide-react";

const PYTHON_CODE = `"""
Production-Ready Multi-Agent System (AI Course Creator)
Google AI Studio Free-Tier Migration of the Vertex AI Roadshow Codelab

In Vertex AI (Original Codelab):
    from google.cloud import aiplatform
    import vertexai
    # Requires GCP billing, project ID, location, IAM service accounts, ADC:
    vertexai.init(project="my-gcp-project", location="us-central1")

In Google AI Studio (Free-Tier Migration):
    from google import genai
    from google.genai import types
    # Zero billing setup needed!
    # Simply obtain a free key from https://aistudio.google.com
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

Install dependencies:
    pip install google-genai pydantic

Run locally:
    export GEMINI_API_KEY="your-free-gemini-key"
    python multi_agent_system.py
"""

import os
import json
from typing import List, Optional
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

# 1. Initialize client using the free Gemini API key
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("Warning: GEMINI_API_KEY is not set. Get your free key at https://aistudio.google.com")

client = genai.Client(api_key=api_key)

# We use gemini-3.8-flash: ultra-fast, structured schemas, 15 RPM free tier!
MODEL_NAME = "gemini-3.8-flash"


# =====================================================================
# Pydantic Schemas for Type-Safe Structured Outputs
# =====================================================================

class ModuleOutline(BaseModel):
    module_number: int
    title: str
    description: str
    key_concepts: List[str]
    hands_on_activity: str

class ResearchDossier(BaseModel):
    topic: str
    audience: str
    prerequisites: List[str]
    learning_objectives: List[str]
    key_modules: List[ModuleOutline]
    technical_pitfalls: List[str]
    code_examples_to_include: List[str]
    research_summary: str

class JudgeEvaluation(BaseModel):
    completeness_score: int = Field(description="Score out of 25")
    pedagogical_score: int = Field(description="Score out of 25")
    actionability_score: int = Field(description="Score out of 25")
    clarity_score: int = Field(description="Score out of 25")
    total_score: int = Field(description="Sum of scores out of 100")
    passed: bool = Field(description="True if total_score >= passing_threshold")
    strengths: List[str]
    weaknesses: List[str]
    actionable_feedback: str = Field(description="Clear directives for researcher refinement")

class CodeSnippet(BaseModel):
    language: str
    file_name: str
    code: str
    explanation: str

class Exercise(BaseModel):
    prompt: str
    hints: List[str]
    solution_snippet: Optional[str] = None

class DetailedModule(BaseModel):
    module_number: int
    title: str
    duration_minutes: int
    conceptual_theory: str
    code_walkthrough: CodeSnippet
    exercise: Exercise
    key_takeaway: str

class QuizItem(BaseModel):
    question: str
    options: List[str]
    correct_answer_index: int
    explanation: str

class CapstoneProject(BaseModel):
    title: str
    description: str
    deliverables: List[str]

class FinalCourse(BaseModel):
    course_title: str
    tagline: str
    target_audience: str
    estimated_hours: int
    prerequisites: List[str]
    modules: List[DetailedModule]
    quiz: List[QuizItem]
    capstone: CapstoneProject


# =====================================================================
# AGENT 1: Researcher Agent
# =====================================================================
def run_researcher_agent(topic: str, audience: str, previous_critique: Optional[str] = None, iteration: int = 1) -> ResearchDossier:
    """
    Researches and decomposes a technical topic into structured modules.
    If previous critique is supplied, it refines the proposal to address every point.
    """
    system_instruction = f"""You are an expert Curriculum Research Agent in a production Multi-Agent AI system.
Target Audience: {audience}

Instructions:
1. Formulate clear learning objectives aligned with Bloom's taxonomy.
2. Structure modules logically using progressive disclosure.
3. Include real-world practical code examples and hands-on exercises for every module.
4. Pinpoint common gotchas, pitfalls, and debugging patterns.
"""
    if previous_critique:
        system_instruction += f"""
CRITICAL REFINEMENT REQUIRED:
The Judge rejected your prior submission (Iteration {iteration - 1}) with this feedback:
"{previous_critique}"
You MUST explicitly address every deficiency pointed out in the feedback!
"""

    prompt = f"Please research and plan the curriculum outline for: '{topic}' targeted at '{audience}'."

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=ResearchDossier,
            temperature=0.7,
        ),
    )
    return ResearchDossier.model_validate_json(response.text)


# =====================================================================
# AGENT 2: Judge Agent (Evaluator)
# =====================================================================
def run_judge_agent(dossier: ResearchDossier, passing_score: int = 80) -> JudgeEvaluation:
    """
    Evaluates research quality across 4 rubrics:
    Completeness (25), Pedagogical Flow (25), Actionability/Code (25), Clarity (25).
    """
    system_instruction = f"""You are a strict, objective Academic Reviewer and Senior Curriculum Architect.
Evaluate the provided Research Dossier against the 4 rubrics (25 pts each = 100 max).

Passing Threshold: {passing_score}/100.
If total_score >= {passing_score}, mark passed = True. Otherwise passed = False.
Provide clear, constructive, bulleted 'actionable_feedback' for any flaws.
"""

    prompt = f"Evaluate this curriculum dossier:\\n\\n{dossier.model_dump_json(indent=2)}"

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=JudgeEvaluation,
            temperature=0.2, # Low temperature for objective assessment
        ),
    )
    eval_result = JudgeEvaluation.model_validate_json(response.text)
    eval_result.passed = eval_result.total_score >= passing_score
    return eval_result


# =====================================================================
# AGENT 3: Content Builder Agent
# =====================================================================
def run_content_builder_agent(dossier: ResearchDossier) -> FinalCourse:
    """
    Converts approved research dossier into full course content with code, exercises, and quizzes.
    """
    system_instruction = """You are a Master Technical Author and Educator.
Build out complete, in-depth course materials from the approved research plan.
Include fully documented, syntactically clean code walkthroughs and interactive exercises.
"""
    prompt = f"Write the full course curriculum based on this approved dossier:\\n\\n{dossier.model_dump_json(indent=2)}"

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=FinalCourse,
            temperature=0.6,
        ),
    )
    return FinalCourse.model_validate_json(response.text)


# =====================================================================
# ORCHESTRATOR: LoopAgent & Sequential Pipeline
# =====================================================================
def run_multi_agent_system(topic: str, audience: str = "Intermediate Software Engineers", passing_score: int = 80, max_iterations: int = 3):
    print(f"=== Multi-Agent System Initializing ===")
    print(f"Topic: {topic} | Audience: {audience}")
    print(f"Engine: Google AI Studio ({MODEL_NAME}) - Free Tier\\n")

    current_critique = None
    approved_dossier = None
    final_eval = None

    # Step 1: LoopAgent (Researcher <-> Judge Refinement Loop)
    for iteration in range(1, max_iterations + 1):
        print(f"--> [LoopAgent] Iteration {iteration}/{max_iterations}")
        print("    [Researcher Agent] Analyzing topic and crafting curriculum...")
        dossier = run_researcher_agent(topic, audience, previous_critique=current_critique, iteration=iteration)
        print(f"    [Researcher Agent] Drafted {len(dossier.key_modules)} modules.")

        print("    [Judge Agent] Grading dossier against rubrics...")
        evaluation = run_judge_agent(dossier, passing_score=passing_score)
        print(f"    [Judge Agent] Score: {evaluation.total_score}/100 (Pass: {evaluation.passed})")

        if evaluation.passed:
            print("    [Judge Agent] APPROVED! Advancing to Content Builder.")
            approved_dossier = dossier
            final_eval = evaluation
            break
        else:
            print(f"    [Judge Agent] REJECTED. Critique: {evaluation.actionable_feedback[:100]}...")
            current_critique = evaluation.actionable_feedback
            approved_dossier = dossier
            final_eval = evaluation

    # Step 2: Content Builder Agent
    print("\\n--> [Sequential Pipeline] Handing off to Content Builder Agent...")
    course = run_content_builder_agent(approved_dossier)
    print(f"--> [Content Builder] Completed '{course.course_title}'!")
    print(f"    Generated {len(course.modules)} detailed lessons, {len(course.quiz)} quiz items, and capstone.")

    return {
        "dossier": approved_dossier,
        "evaluation": final_eval,
        "course": course,
    }


if __name__ == "__main__":
    sample_topic = "Building Event-Driven Microservices with Apache Kafka and Node.js"
    run_multi_agent_system(sample_topic, audience="Intermediate Backend Developers", passing_score=80)
`;

const TYPESCRIPT_CODE = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TypeScript Multi-Agent System Core Engine (Google AI Studio Edition)
 * 
 * Install dependencies:
 *   npm install @google/genai dotenv
 * 
 * Run locally:
 *   export GEMINI_API_KEY="your-free-key"
 *   npx tsx multiAgent.ts
 */

import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const MODEL = "gemini-3.8-flash";

// Researcher Agent
export async function runResearcherAgent(topic: string, audience: string, previousCritique?: string) {
  const systemInstruction = \`You are an expert Curriculum Researcher. Target: \${audience}.
Plan a comprehensive curriculum outline with prerequisites, learning objectives, and hands-on coding activities.
\${previousCritique ? \`REVISE BASED ON JUDGE CRITIQUE: "\${previousCritique}"\` : ""}\`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: \`Research syllabus for: "\${topic}"\`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          audience: { type: Type.STRING },
          prerequisites: { type: Type.ARRAY, items: { type: Type.STRING } },
          learningObjectives: { type: Type.ARRAY, items: { type: Type.STRING } },
          keyModules: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                moduleNumber: { type: Type.INTEGER },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
                handsOnActivityIdea: { type: Type.STRING },
              },
              required: ["moduleNumber", "title", "description", "keyConcepts", "handsOnActivityIdea"],
            },
          },
        },
        required: ["topic", "audience", "prerequisites", "learningObjectives", "keyModules"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}

// Judge Agent
export async function runJudgeAgent(dossier: any, passingScore = 80) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: \`Evaluate this curriculum dossier:\\n\${JSON.stringify(dossier, null, 2)}\`,
    config: {
      systemInstruction: \`You are a strict Curriculum Judge. Score out of 100 based on Completeness, Pedagogical Flow, Actionability, and Clarity. Passing threshold is \${passingScore}.\`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          totalScore: { type: Type.INTEGER },
          passed: { type: Type.BOOLEAN },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          actionableFeedback: { type: Type.STRING },
        },
        required: ["totalScore", "passed", "strengths", "weaknesses", "actionableFeedback"],
      },
    },
  });

  const result = JSON.parse(response.text || "{}");
  result.passed = result.totalScore >= passingScore;
  return result;
}

// LoopAgent
export async function runLoopAgent(topic: string, audience: string, maxIterations = 3) {
  let critique: string | undefined;
  for (let iter = 1; iter <= maxIterations; iter++) {
    console.log(\`Loop Iteration \${iter}/\${maxIterations}\`);
    const dossier = await runResearcherAgent(topic, audience, critique);
    const evaluation = await runJudgeAgent(dossier, 80);
    console.log(\`Judge Score: \${evaluation.totalScore}/100 | Passed: \${evaluation.passed}\`);
    if (evaluation.passed) return { dossier, evaluation, iterations: iter };
    critique = evaluation.actionableFeedback;
  }
}
`;

export const CodeExporterView: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<"python" | "typescript">("python");
  const [copied, setCopied] = useState(false);

  const activeCode = selectedLang === "python" ? PYTHON_CODE : TYPESCRIPT_CODE;
  const fileName = selectedLang === "python" ? "multi_agent_system.py" : "multi_agent_system.ts";

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([activeCode], {
      type: selectedLang === "python" ? "text/x-python" : "text/typescript",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-400">
              Exportable Codebases
            </span>
            <span className="text-xs text-slate-400">
              Ready to run locally with your free API key
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Standalone Multi-Agent Implementation
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Contains all 3 agents (Researcher, Judge, Content Builder) and 2 orchestrators (LoopAgent & SequentialAgent).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Code</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-lg shadow-blue-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Download {fileName}</span>
          </button>
        </div>
      </div>

      {/* CLI Quickstart Card */}
      <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-300">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>How to Run Locally on Your Machine (30 Seconds)</span>
        </div>
        <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300 space-y-1 overflow-x-auto">
          {selectedLang === "python" ? (
            <>
              <p className="text-slate-500"># 1. Install Google GenAI SDK & Pydantic</p>
              <p className="text-emerald-400">pip install google-genai pydantic</p>
              <p className="text-slate-500 pt-1"># 2. Set your free Gemini API key</p>
              <p className="text-cyan-400">export GEMINI_API_KEY="your-free-key-from-aistudio"</p>
              <p className="text-slate-500 pt-1"># 3. Execute the multi-agent workflow</p>
              <p className="text-white">python multi_agent_system.py</p>
            </>
          ) : (
            <>
              <p className="text-slate-500"># 1. Install Google GenAI SDK & tsx</p>
              <p className="text-emerald-400">npm install @google/genai dotenv tsx</p>
              <p className="text-slate-500 pt-1"># 2. Set your free Gemini API key</p>
              <p className="text-cyan-400">export GEMINI_API_KEY="your-free-key-from-aistudio"</p>
              <p className="text-slate-500 pt-1"># 3. Execute with tsx</p>
              <p className="text-white">npx tsx multiAgent.ts</p>
            </>
          )}
        </div>
      </div>

      {/* Language Switcher Tabs */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setSelectedLang("python")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            selectedLang === "python"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          <FileCode2 className="w-4 h-4 text-amber-400" />
          <span>Python 3.10+ (google-genai)</span>
        </button>

        <button
          onClick={() => setSelectedLang("typescript")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            selectedLang === "typescript"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          <Code2 className="w-4 h-4 text-cyan-400" />
          <span>TypeScript (@google/genai)</span>
        </button>
      </div>

      {/* Code Editor Window */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 bg-slate-900/80 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-xs font-mono text-slate-300 font-semibold">{fileName}</span>
          </div>

          <span className="text-xs text-slate-400">
            {selectedLang === "python" ? "320 lines • Fully Commented" : "150 lines • Clean Typed"}
          </span>
        </div>

        <pre className="p-6 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[700px] overflow-y-auto">
          <code>{activeCode}</code>
        </pre>
      </div>
    </div>
  );
};
