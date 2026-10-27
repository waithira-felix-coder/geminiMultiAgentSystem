/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CodelabStep {
  id: string;
  stepNumber: number;
  title: string;
  badge: string;
  summary: string;
  vertexSnippet?: string;
  aiStudioSnippet?: string;
  detailedExplanation: string[];
  keyDifferences: {
    feature: string;
    vertexAI: string;
    aiStudio: string;
  }[];
  proTips: string[];
}

export const CODELAB_STEPS: CodelabStep[] = [
  {
    id: "architecture",
    stepNumber: 1,
    title: "The Multi-Agent Architecture (Micro-Agents vs Monolithic Prompts)",
    badge: "Core Architecture",
    summary:
      "Why decompose complex workflows into specialized micro-agents instead of a single giant prompt.",
    detailedExplanation: [
      "In traditional LLM workflows, developers often start with a monolithic prompt: 'You are an expert curriculum creator, researcher, grader, and author. Research the topic, verify facts, structure chapters, write code examples, and ensure high quality.'",
      "Monolithic prompts exhibit high failure rates in production: models fail to respect secondary constraints, hallucinations compound across stages, latency is high without intermediate visibility, and debugging a failed run is nearly impossible.",
      "The Micro-Agent Pattern isolates each discrete cognitive responsibility into a purpose-built agent with its own system prompt, tools, input constraints, and output schema.",
      "In our system, we define three specialized agents:",
      "1. Researcher Agent: Focuses solely on curriculum decomposition, prerequisite identification, Bloom's taxonomy objectives, and technical pitfall mapping.",
      "2. Judge Agent: An objective evaluator that grades the researcher's output against strict rubrics (Completeness, Pedagogical flow, Actionability, Clarity) and returns pass/fail with actionable critique.",
      "3. Content Builder Agent: Authors comprehensive module text, executable code snippets, exercises, and quizzes once the curriculum outline is approved.",
      "Orchestrators (LoopAgent and SequentialAgent) manage state and control flow deterministically.",
    ],
    keyDifferences: [
      {
        feature: "Design Pattern",
        vertexAI: "Agent Development Kit (ADK) / Vertex AI Agent Builder",
        aiStudio: "Deterministic Micro-Agent state machines with typed @google/genai",
      },
      {
        feature: "Intermediate State",
        vertexAI: "Managed in GCP Cloud Session State",
        aiStudio: "Explicit JSON contracts passed cleanly in code",
      },
      {
        feature: "Testability",
        vertexAI: "Requires GCP deployment or local mock harness",
        aiStudio: "Directly testable via single unit-level function calls",
      },
    ],
    proTips: [
      "Keep system prompts hyper-focused on ONE role.",
      "Always enforce structured schemas (responseSchema) between agent handoffs.",
      "Use temperature 0.2 for evaluators (Judge) to maintain consistency and 0.7 for generative agents (Researcher, Content Builder).",
    ],
  },
  {
    id: "client-migration",
    stepNumber: 2,
    title: "Client Initialization & Zero-Billing Setup (Vertex AI ➔ AI Studio)",
    badge: "Free-Tier Migration",
    summary:
      "Replacing expensive GCP billing and service account setup with the free Gemini API key.",
    vertexSnippet: `# === Vertex AI (Original Codelab) ===
import vertexai
from google.cloud import aiplatform

# Requires:
# 1. Google Cloud Project with Active Billing ($)
# 2. Vertex AI API enabled in GCP Console
# 3. Application Default Credentials (ADC) / gcloud auth
# 4. Regional resource quotas
vertexai.init(
    project="your-gcp-project-id",
    location="us-central1"
)
model = vertexai.generative_models.GenerativeModel("gemini-1.5-pro")`,
    aiStudioSnippet: `# === Google AI Studio (Free-Tier Migration) ===
from google import genai
from google.genai import types

# Requires:
# 1. Zero GCP billing setup!
# 2. Free API key from https://aistudio.google.com
# 3. Modern @google/genai SDK (v2.4+)
# 4. Generous free tier (up to 15 RPM on gemini-3.8-flash)
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# Standard generateContent call
response = client.models.generate_content(
    model="gemini-3.8-flash",
    contents="Your prompt here"
)`,
    detailedExplanation: [
      "In the original Vertex AI codelab, running multi-agent workflows required setting up a Google Cloud Billing account, creating a Cloud Project, enabling the Vertex AI API, configuring IAM service accounts, and setting up Application Default Credentials (ADC) via `gcloud auth application-default login`.",
      "For individual developers, students, or teams prototyping without enterprise GCP budgets, this creates significant friction.",
      "With Google AI Studio, you can acquire a free Gemini API key in seconds without entering a credit card or provisioning GCP infrastructure.",
      "The modern Google Gen AI SDK (`google-genai` for Python and `@google/genai` for TypeScript) provides a unified interface. You simply instantiate `genai.Client(api_key=...)` or `new GoogleGenAI({ apiKey })`.",
      "By using `gemini-3.8-flash`, you get state-of-the-art speed, reasoning capabilities, structured outputs, and large context windows within the free tier quota.",
    ],
    keyDifferences: [
      {
        feature: "Billing Requirement",
        vertexAI: "Credit Card / Cloud Billing Account Mandatory",
        aiStudio: "100% Free Tier (No billing or credit card required)",
      },
      {
        feature: "SDK Package",
        vertexAI: "google-cloud-aiplatform / @google-cloud/vertexai",
        aiStudio: "google-genai (Python) / @google/genai (TypeScript)",
      },
      {
        feature: "Authentication",
        vertexAI: "Service Account JSON / OAuth 2.0 / ADC",
        aiStudio: "Standard API Key (GEMINI_API_KEY environment variable)",
      },
      {
        feature: "Setup Time",
        vertexAI: "15-30 minutes of GCP IAM and project provisioning",
        aiStudio: "Under 60 seconds",
      },
    ],
    proTips: [
      "Never commit your GEMINI_API_KEY to Git repository source control.",
      "On full-stack web apps, always invoke the Gemini API from server-side routes (like server.ts) to protect the key from browser exposure.",
      "Set User-Agent 'aistudio-build' in httpOptions when building in AI Studio.",
    ],
  },
  {
    id: "structured-outputs",
    stepNumber: 3,
    title: "Structured Outputs with JSON Schema (The Glue Between Agents)",
    badge: "Reliability",
    summary:
      "Eliminating brittle regex parsing by guaranteeing type-safe JSON contracts between agents.",
    vertexSnippet: `# Vertex AI legacy approach often used manual prompting:
prompt = "Output valid JSON with keys: 'topic', 'modules'..."
# Fragile! Often returned markdown ticks \`\`\`json ... \`\`\` that broke json.loads()`,
    aiStudioSnippet: `# Google AI Studio modern typed schema:
from pydantic import BaseModel
from google.genai import types

class ResearchDossier(BaseModel):
    topic: str
    audience: str
    prerequisites: list[str]
    learning_objectives: list[str]
    key_modules: list[ModuleOutline]

# Model is constrained at the decoding token level to return valid JSON:
response = client.models.generate_content(
    model="gemini-3.8-flash",
    contents=user_prompt,
    config=types.GenerateContentConfig(
        system_instruction=system_prompt,
        response_mime_type="application/json",
        response_schema=ResearchDossier, # Pydantic schema!
    ),
)`,
    detailedExplanation: [
      "In a multi-agent system, the output of Agent A (Researcher) is the direct input to Agent B (Judge).",
      "If Agent A returns unstructured text or unformatted markdown, Agent B will spend unnecessary tokens attempting to parse it, or worse, fail completely.",
      "The Gemini API supports native JSON schema enforcement via `response_mime_type='application/json'` and `response_schema`.",
      "In TypeScript, you define the schema using `Type.OBJECT`, `Type.ARRAY`, `Type.STRING`, and `Type.INTEGER` from `@google/genai`.",
      "In Python, you can directly pass a Pydantic `BaseModel` class as the `response_schema`.",
      "This guarantees that the model will NEVER return invalid JSON, missing keys, or markdown formatting fences.",
    ],
    keyDifferences: [
      {
        feature: "Output Format",
        vertexAI: "Manual string prompt or complex ToolDeclaration",
        aiStudio: "Native responseSchema (TypeScript Type enum or Python Pydantic)",
      },
      {
        feature: "Validation",
        vertexAI: "Manual try/catch json.loads with retry logic",
        aiStudio: "Guaranteed valid schema output directly from the API",
      },
      {
        feature: "Type Safety",
        vertexAI: "Dynamic dicts",
        aiStudio: "End-to-end typed interfaces across client & server",
      },
    ],
    proTips: [
      "Mark critical fields as `required` in your schema definition.",
      "Add short `description` strings to schema properties to guide the model on formatting (e.g. 'Score out of 25').",
      "Do not use responseSchema with image generation models (like nano banana); it is tailored for text & multimodal reasoning models.",
    ],
  },
  {
    id: "orchestrators",
    stepNumber: 4,
    title: "Building Control Logic: LoopAgent & SequentialAgent",
    badge: "Orchestration",
    summary:
      "Creating iterative feedback cycles and multi-stage execution pipelines.",
    vertexSnippet: `# Vertex AI Agent Builder / ADK provides high-level abstractions:
# But customization and debugging internal state can be opaque.`,
    aiStudioSnippet: `// Pure, deterministic orchestration in TypeScript:
export async function runLoopAgent(topic, audience, maxIterations = 3) {
  let critique = undefined;
  for (let iter = 1; iter <= maxIterations; iter++) {
    // 1. Researcher drafts or refines based on critique
    const dossier = await runResearcherAgent(topic, audience, critique);
    
    // 2. Judge scores against rubrics
    const eval = await runJudgeAgent(dossier, 80);
    
    // 3. Convergence check
    if (eval.passed) {
      return { approvedDossier: dossier, evaluation: eval };
    }
    
    // 4. Critique fed forward into next iteration
    critique = eval.actionableFeedback;
  }
  return { approvedDossier: bestDossier, evaluation: bestEval };
}`,
    detailedExplanation: [
      "A common mistake when moving to multi-agent architectures is wrapping everything in heavyweight frameworks that obscure agent communication.",
      "The Codelab demonstrates two fundamental orchestration patterns:",
      "1. LoopAgent (Iterative Refinement): Acts like a `while` loop with a convergence condition. Researcher produces a draft; Judge reviews it. If Judge rejects, it supplies actionable feedback, and the loop repeats until approval or max iterations.",
      "2. SequentialAgent (Pipeline): Chaining components sequentially. [LoopAgent(Researcher <-> Judge)] feeds directly into [Content Builder Agent].",
      "This separation gives complete observability: you can track the exact token usage, latency, and rubric scores of each iteration independently.",
    ],
    keyDifferences: [
      {
        feature: "Flow Control",
        vertexAI: "ADK Workflow Graph / Vertex Orchestrator",
        aiStudio: "Code-native async/await loops & sequential pipelines",
      },
      {
        feature: "Debugging & Observability",
        vertexAI: "GCP Cloud Logging & Cloud Trace",
        aiStudio: "Real-time Server-Sent Events (SSE) streaming direct to UI",
      },
      {
        feature: "Cost Control",
        vertexAI: "Cloud billing charges per invocation",
        aiStudio: "Free tier with explicit maxIterations guards",
      },
    ],
    proTips: [
      "Always set a hard `maxIterations` cap (typically 3 to 5) to prevent infinite loops.",
      "Track the 'best candidate' during the loop so that if max iterations are reached without meeting the pass threshold, the system gracefully degrades by using the highest-scoring attempt.",
      "Emit events at each stage to provide users with visual progress.",
    ],
  },
  {
    id: "deployment",
    stepNumber: 5,
    title: "Testing, Free Quotas & Deployment Best Practices",
    badge: "Production Readiness",
    summary:
      "Managing free-tier rate limits, server architecture, and zero-downtime deployment.",
    detailedExplanation: [
      "When deploying a multi-agent application on the Google AI Studio free tier, several production considerations apply:",
      "1. Free Tier Rate Limits: `gemini-3.8-flash` free tier allows up to 15 Requests Per Minute (RPM) and 1,000,000 Tokens Per Minute (TPM). Because our multi-agent pipeline makes 3-7 sequential requests (depending on loop iterations), a single workflow will consume ~3-5 requests in under a minute.",
      "2. Server-Side Execution: Never put your Gemini API key in client-side React bundles. Host an Express/Node server (like our server.ts) or FastAPI Python server that keeps `GEMINI_API_KEY` secure in `process.env`.",
      "3. Real-Time Streaming: Multi-agent tasks can take 10-30 seconds to complete full generation. Use Server-Sent Events (SSE) or WebSockets to stream partial status and tokens to the user interface, preventing timeout issues.",
      "4. Cloud Deployment: This codebase is ready to deploy directly on Google Cloud Run, AI Studio, or Docker container environments using `npm run build` and `node server.ts`.",
    ],
    keyDifferences: [
      {
        feature: "Deployment Target",
        vertexAI: "Vertex AI Model Garden / Endpoint",
        aiStudio: "Any Node.js or Python runtime / Cloud Run container",
      },
      {
        feature: "Secret Management",
        vertexAI: "GCP Secret Manager & IAM roles",
        aiStudio: "Environment variable GEMINI_API_KEY",
      },
      {
        feature: "Scaling",
        vertexAI: "Auto-scaled Vertex Endpoints with minimum hourly charge",
        aiStudio: "Serverless web server (scale to zero free tier)",
      },
    ],
    proTips: [
      "Implement exponential backoff retry logic if you ever encounter HTTP 429 (Resource Exhausted).",
      "Use Vite middleware mode in development and serve static `dist` files in production for maximum performance.",
      "Enable SSE streaming so users never stare at a blank loading spinner.",
    ],
  },
];
