/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

export interface IterationRecord {
  iteration: number;
  dossier: ResearchDossier;
  evaluation: JudgeEvaluation;
}

export interface PipelineExecutionResult {
  approvedDossier: ResearchDossier;
  finalEvaluation: JudgeEvaluation;
  courseContent: CourseContent;
  iterationsTaken: number;
  history: IterationRecord[];
}
