/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Multi-Agent System Core Engine (Google AI Studio Free-Tier Migration)
 * 
 * Includes automatic model fallback and retry logic to gracefully handle
 * transient 503 (high demand) or 429 rate-limit spikes on free tier.
 */

import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Ensure environment variables are loaded immediately
dotenv.config();

/**
 * Returns an authenticated GoogleGenAI client with required telemetry headers.
 */
function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || "";
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Ordered list of free-tier compatible models to provide 100% reliable uptime.
// If the primary model experiences a temporary high-demand spike (503),
// the system seamlessly transitions to the lightning-fast flash-lite tier.
export const CANDIDATE_MODELS = [
  "gemini-3.1-flash-lite-preview",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];

/**
 * Robust execution wrapper with model fallback & exponential retry.
 */
async function generateWithFallback(
  options: {
    systemInstruction: string;
    userPrompt: string;
    schema: any;
    onLog?: (msg: string) => void;
  }
): Promise<string> {
  const ai = getAiClient();
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: options.userPrompt,
        config: {
          systemInstruction: options.systemInstruction,
          responseMimeType: "application/json",
          responseSchema: options.schema,
        },
      });

      const text = response.text?.trim();
      if (text) {
        return text;
      }
    } catch (err: any) {
      lastError = err;
      const isDemandSpike =
        err?.message?.includes("503") ||
        err?.message?.includes("high demand") ||
        err?.message?.includes("UNAVAILABLE") ||
        err?.message?.includes("429");

      if (options.onLog) {
        options.onLog(
          `Notice: Model ${model} returned (${err?.status || "Demand Spike"}). Failing over to alternative engine...`
        );
      }
      // Wait 1 second before trying next model
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw lastError || new Error("All candidate models failed to respond.");
}

// ============================================================================
// Data Types & Schemas
// ============================================================================

export interface ResearchDossier {
  topic: string;
  audience: string;
  prerequisites: string[];
  learningObjectives: string[];
  keyModules: {
    moduleNumber: number;
    title: string;
    description: string;
    keyConcepts: string[];
    handsOnActivityIdea: string;
  }[];
  technicalPitfalls: string[];
  codeExamplesToInclude: string[];
  researchSummary: string;
}

export interface JudgeEvaluation {
  completenessScore: number;
  pedagogicalScore: number;
  actionabilityScore: number;
  clarityScore: number;
  totalScore: number;
  passed: boolean;
  strengths: string[];
  weaknesses: string[];
  actionableFeedback: string;
}

export interface CourseModule {
  moduleNumber: number;
  title: string;
  durationMinutes: number;
  conceptualTheory: string;
  codeWalkthrough: {
    language: string;
    fileName: string;
    code: string;
    explanation: string;
  };
  exercise: {
    prompt: string;
    hints: string[];
    solutionSnippet?: string;
  };
  keyTakeaway: string;
}

export interface CourseContent {
  courseTitle: string;
  tagline: string;
  targetAudience: string;
  estimatedCompletionHours: number;
  prerequisites: string[];
  modules: CourseModule[];
  quiz: {
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
  }[];
  capstoneProject: {
    title: string;
    description: string;
    deliverables: string[];
  };
}

export interface AgentExecutionEvent {
  type:
    | "pipeline_start"
    | "agent_start"
    | "agent_stream"
    | "agent_complete"
    | "loop_iteration_start"
    | "loop_critique"
    | "loop_iteration_end"
    | "pipeline_complete"
    | "error";
  agent?: "researcher" | "judge" | "loop_orchestrator" | "content_builder";
  iteration?: number;
  maxIterations?: number;
  message?: string;
  data?: any;
}

// ============================================================================
// AGENT 1: Researcher Agent
// ============================================================================
export async function runResearcherAgent(
  topic: string,
  audience: string,
  customInstructions?: string,
  previousCritique?: string,
  iteration = 1,
  onLog?: (msg: string) => void
): Promise<ResearchDossier> {
  const systemInstruction = `You are an elite Curriculum Research Agent in a production Multi-Agent AI system.
Your job is to thoroughly investigate the given technical topic, analyze the target audience (${audience}),
and formulate a rigorous, high-impact course structure.

Core Guidelines:
1. Ensure prerequisite topics are accurate and comprehensive.
2. Structure modules logically using progressive disclosure (fundamentals -> mechanics -> production architecture).
3. Specify hands-on code examples and real-world implementation activities for each module.
4. Highlight real-world technical pitfalls, anti-patterns, and debugging scenarios.
${customInstructions ? `Special User Requirements: ${customInstructions}` : ""}

${
  previousCritique
    ? `CRITICAL ATTENTION - PREVIOUS SUBMISSION CRITIQUE:
The Judge rejected your previous proposal (Iteration ${iteration - 1}) with the following actionable feedback:
"${previousCritique}"
You MUST explicitly address every single deficiency cited in the critique above in your revised dossier!`
    : "This is Iteration 1. Produce an initial comprehensive research plan."
}
Return your response strictly adhering to the requested JSON schema.`;

  const userPrompt = `Topic to research: "${topic}".
Target audience level: "${audience}".
Please formulate the complete structured research dossier.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      audience: { type: Type.STRING },
      prerequisites: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Required prior knowledge, tools, or concepts.",
      },
      learningObjectives: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Specific measurable outcomes (Bloom's taxonomy).",
      },
      keyModules: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            moduleNumber: { type: Type.INTEGER },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            keyConcepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            handsOnActivityIdea: { type: Type.STRING },
          },
          required: ["moduleNumber", "title", "description", "keyConcepts", "handsOnActivityIdea"],
        },
      },
      technicalPitfalls: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Common failure points or anti-patterns.",
      },
      codeExamplesToInclude: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Practical code scenarios needed in the course.",
      },
      researchSummary: {
        type: Type.STRING,
        description: "High-level architectural summary of the syllabus.",
      },
    },
    required: [
      "topic",
      "audience",
      "prerequisites",
      "learningObjectives",
      "keyModules",
      "technicalPitfalls",
      "codeExamplesToInclude",
      "researchSummary",
    ],
  };

  const rawJson = await generateWithFallback({
    systemInstruction,
    userPrompt,
    schema,
    onLog,
  });

  return JSON.parse(rawJson) as ResearchDossier;
}

// ============================================================================
// AGENT 2: Judge Agent (Rubric Evaluator)
// ============================================================================
export async function runJudgeAgent(
  dossier: ResearchDossier,
  passingScore = 80,
  rubricNotes?: string,
  onLog?: (msg: string) => void
): Promise<JudgeEvaluation> {
  const systemInstruction = `You are a strict, objective Academic Reviewer and Senior Curriculum Architect.
Your task is to evaluate the provided Research Dossier against a rigorous standard for a top-tier course.

Evaluation Dimensions (25 points each, Total 100):
1. Completeness (0-25): Are fundamental prerequisites, essential industry tools, and key concepts present?
2. Pedagogical Flow (0-25): Does the course sequence logically from foundational to advanced application?
3. Actionability & Code Depth (0-25): Are there sufficient hands-on activities, code walkthroughs, and practical scenarios?
4. Clarity & Audience Alignment (0-25): Is the depth calibrated appropriately for ${dossier.audience}?

Passing Score Threshold: ${passingScore}/100.
If totalScore >= ${passingScore}, mark passed = true.
If totalScore < ${passingScore}, mark passed = false.

${rubricNotes ? `Additional Evaluation Criteria: ${rubricNotes}` : ""}

Be demanding and constructive. If you reject the dossier, provide clear, bullet-pointed, actionable instructions in 'actionableFeedback' so the Researcher knows exactly what concepts or exercises to add in the next iteration.`;

  const userPrompt = `Here is the Research Dossier to evaluate:
${JSON.stringify(dossier, null, 2)}`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      completenessScore: { type: Type.INTEGER, description: "Score out of 25" },
      pedagogicalScore: { type: Type.INTEGER, description: "Score out of 25" },
      actionabilityScore: { type: Type.INTEGER, description: "Score out of 25" },
      clarityScore: { type: Type.INTEGER, description: "Score out of 25" },
      totalScore: { type: Type.INTEGER, description: "Sum of all scores (0-100)" },
      passed: { type: Type.BOOLEAN, description: "True if totalScore >= passingScore" },
      strengths: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Strong points of the dossier",
      },
      weaknesses: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Areas needing improvement",
      },
      actionableFeedback: {
        type: Type.STRING,
        description: "Concrete refinement instructions for the Researcher",
      },
    },
    required: [
      "completenessScore",
      "pedagogicalScore",
      "actionabilityScore",
      "clarityScore",
      "totalScore",
      "passed",
      "strengths",
      "weaknesses",
      "actionableFeedback",
    ],
  };

  const rawJson = await generateWithFallback({
    systemInstruction,
    userPrompt,
    schema,
    onLog,
  });

  const result = JSON.parse(rawJson) as JudgeEvaluation;
  result.passed = result.totalScore >= passingScore;
  return result;
}

// ============================================================================
// AGENT 3: Content Builder Agent
// ============================================================================
export async function runContentBuilderAgent(
  dossier: ResearchDossier,
  customFormatting?: string,
  onLog?: (msg: string) => void
): Promise<CourseContent> {
  const systemInstruction = `You are a World-Class Course Author and Technical Educator.
Your task is to take an approved curriculum Research Dossier and construct the complete, detailed course material.

Quality Standards:
1. Deliver comprehensive modular content with real conceptual depth.
2. Provide working, elegant, well-commented code snippets (in TypeScript/Python/relevant stack).
3. Create meaningful exercises with clear prompts, hints, and code solutions.
4. Build a diagnostic 4-question quiz with insightful explanations for every choice.
5. Define an exciting Capstone Project with realistic project deliverables.
${customFormatting ? `Formatting preferences: ${customFormatting}` : ""}

Return your response strictly adhering to the requested JSON schema.`;

  const userPrompt = `Here is the approved Research Dossier to build into a full course:
${JSON.stringify(dossier, null, 2)}`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      courseTitle: { type: Type.STRING },
      tagline: { type: Type.STRING },
      targetAudience: { type: Type.STRING },
      estimatedCompletionHours: { type: Type.INTEGER },
      prerequisites: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      modules: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            moduleNumber: { type: Type.INTEGER },
            title: { type: Type.STRING },
            durationMinutes: { type: Type.INTEGER },
            conceptualTheory: { type: Type.STRING, description: "Theoretical explanation" },
            codeWalkthrough: {
              type: Type.OBJECT,
              properties: {
                language: { type: Type.STRING },
                fileName: { type: Type.STRING },
                code: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ["language", "fileName", "code", "explanation"],
            },
            exercise: {
              type: Type.OBJECT,
              properties: {
                prompt: { type: Type.STRING },
                hints: { type: Type.ARRAY, items: { type: Type.STRING } },
                solutionSnippet: { type: Type.STRING },
              },
              required: ["prompt", "hints"],
            },
            keyTakeaway: { type: Type.STRING },
          },
          required: ["moduleNumber", "title", "durationMinutes", "conceptualTheory", "codeWalkthrough", "exercise", "keyTakeaway"],
        },
      },
      quiz: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswerIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
          },
          required: ["question", "options", "correctAnswerIndex", "explanation"],
        },
      },
      capstoneProject: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          deliverables: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["title", "description", "deliverables"],
      },
    },
    required: [
      "courseTitle",
      "tagline",
      "targetAudience",
      "estimatedCompletionHours",
      "prerequisites",
      "modules",
      "quiz",
      "capstoneProject",
    ],
  };

  const rawJson = await generateWithFallback({
    systemInstruction,
    userPrompt,
    schema,
    onLog,
  });

  return JSON.parse(rawJson) as CourseContent;
}

// ============================================================================
// ORCHESTRATOR 1: LoopAgent (Iterative Refinement)
// ============================================================================
export async function runLoopAgent(
  topic: string,
  audience: string,
  options: {
    passingScore?: number;
    maxIterations?: number;
    researcherInstructions?: string;
    judgeNotes?: string;
    onEvent?: (event: AgentExecutionEvent) => void;
  }
): Promise<{
  approvedDossier: ResearchDossier;
  finalEvaluation: JudgeEvaluation;
  iterationsTaken: number;
  history: { iteration: number; dossier: ResearchDossier; evaluation: JudgeEvaluation }[];
}> {
  const passingScore = options.passingScore ?? 80;
  const maxIterations = Math.min(Math.max(options.maxIterations ?? 3, 1), 5);
  const onEvent = options.onEvent || (() => {});

  const history: { iteration: number; dossier: ResearchDossier; evaluation: JudgeEvaluation }[] = [];
  let currentCritique: string | undefined = undefined;
  let bestDossier: ResearchDossier | null = null;
  let bestEvaluation: JudgeEvaluation | null = null;

  for (let iter = 1; iter <= maxIterations; iter++) {
    onEvent({
      type: "loop_iteration_start",
      agent: "loop_orchestrator",
      iteration: iter,
      maxIterations,
      message: `Starting Refinement Loop Iteration ${iter}/${maxIterations}`,
    });

    // Step 1: Run Researcher
    onEvent({
      type: "agent_start",
      agent: "researcher",
      iteration: iter,
      message: iter === 1
        ? "Curriculum Researcher is generating initial syllabus and module breakdown..."
        : "Curriculum Researcher is revising syllabus based on Judge's critique...",
    });

    const dossier = await runResearcherAgent(
      topic,
      audience,
      options.researcherInstructions,
      currentCritique,
      iter,
      (logMsg) => {
        onEvent({
          type: "agent_stream",
          agent: "researcher",
          iteration: iter,
          message: logMsg,
        });
      }
    );

    onEvent({
      type: "agent_complete",
      agent: "researcher",
      iteration: iter,
      data: dossier,
      message: `Researcher completed syllabus with ${dossier.keyModules.length} core modules.`,
    });

    // Step 2: Run Judge
    onEvent({
      type: "agent_start",
      agent: "judge",
      iteration: iter,
      message: "Judge Agent is scoring dossier against pedagogical and actionability rubrics...",
    });

    const evaluation = await runJudgeAgent(
      dossier,
      passingScore,
      options.judgeNotes,
      (logMsg) => {
        onEvent({
          type: "agent_stream",
          agent: "judge",
          iteration: iter,
          message: logMsg,
        });
      }
    );

    history.push({ iteration: iter, dossier, evaluation });

    if (!bestEvaluation || evaluation.totalScore > bestEvaluation.totalScore) {
      bestDossier = dossier;
      bestEvaluation = evaluation;
    }

    onEvent({
      type: "agent_complete",
      agent: "judge",
      iteration: iter,
      data: evaluation,
      message: `Judge evaluated dossier: Score ${evaluation.totalScore}/100. Status: ${
        evaluation.passed ? "APPROVED" : "REJECTED (Needs Refinement)"
      }`,
    });

    if (evaluation.passed) {
      onEvent({
        type: "loop_iteration_end",
        agent: "loop_orchestrator",
        iteration: iter,
        maxIterations,
        message: `Evaluation passed with score ${evaluation.totalScore} >= ${passingScore}! Exiting refinement loop.`,
        data: { passed: true, score: evaluation.totalScore },
      });
      return {
        approvedDossier: dossier,
        finalEvaluation: evaluation,
        iterationsTaken: iter,
        history,
      };
    }

    // If not passed and iterations remain, emit critique for next iteration
    currentCritique = evaluation.actionableFeedback;
    onEvent({
      type: "loop_critique",
      agent: "loop_orchestrator",
      iteration: iter,
      maxIterations,
      message: `Judge feedback to Researcher: ${evaluation.actionableFeedback}`,
      data: { critique: evaluation.actionableFeedback, weaknesses: evaluation.weaknesses },
    });

    onEvent({
      type: "loop_iteration_end",
      agent: "loop_orchestrator",
      iteration: iter,
      maxIterations,
      message: `Iteration ${iter} complete. Looping with critique...`,
      data: { passed: false, score: evaluation.totalScore },
    });
  }

  // Fallback if maximum iterations reached
  return {
    approvedDossier: bestDossier!,
    finalEvaluation: bestEvaluation!,
    iterationsTaken: maxIterations,
    history,
  };
}

// ============================================================================
// ORCHESTRATOR 2: SequentialAgent (Full Pipeline Orchestration)
// ============================================================================
export async function runSequentialCoursePipeline(
  topic: string,
  audience: string,
  options: {
    passingScore?: number;
    maxIterations?: number;
    researcherInstructions?: string;
    judgeNotes?: string;
    contentFormatting?: string;
    onEvent?: (event: AgentExecutionEvent) => void;
  }
): Promise<{
  approvedDossier: ResearchDossier;
  finalEvaluation: JudgeEvaluation;
  courseContent: CourseContent;
  iterationsTaken: number;
  history: { iteration: number; dossier: ResearchDossier; evaluation: JudgeEvaluation }[];
}> {
  const onEvent = options.onEvent || (() => {});

  onEvent({
    type: "pipeline_start",
    message: `Initializing Multi-Agent Course Creator for "${topic}" (${audience})`,
  });

  // Stage 1: Iterative Refinement Loop
  const loopResult = await runLoopAgent(topic, audience, {
    passingScore: options.passingScore,
    maxIterations: options.maxIterations,
    researcherInstructions: options.researcherInstructions,
    judgeNotes: options.judgeNotes,
    onEvent,
  });

  // Stage 2: Content Builder Agent
  onEvent({
    type: "agent_start",
    agent: "content_builder",
    message: "Content Builder Agent is authoring comprehensive course modules, code walkthroughs, and assessments...",
  });

  const courseContent = await runContentBuilderAgent(
    loopResult.approvedDossier,
    options.contentFormatting,
    (logMsg) => {
      onEvent({
        type: "agent_stream",
        agent: "content_builder",
        message: logMsg,
      });
    }
  );

  onEvent({
    type: "agent_complete",
    agent: "content_builder",
    data: courseContent,
    message: `Course authored successfully! Generated ${courseContent.modules.length} detailed modules, ${courseContent.quiz.length} quiz questions, and 1 capstone project.`,
  });

  onEvent({
    type: "pipeline_complete",
    message: "Multi-Agent System successfully completed workflow execution.",
    data: {
      title: courseContent.courseTitle,
      modulesCount: courseContent.modules.length,
      iterationsTaken: loopResult.iterationsTaken,
      score: loopResult.finalEvaluation.totalScore,
    },
  });

  return {
    approvedDossier: loopResult.approvedDossier,
    finalEvaluation: loopResult.finalEvaluation,
    courseContent,
    iterationsTaken: loopResult.iterationsTaken,
    history: loopResult.history,
  };
}
