# Multi-Agent System (AI Course Creator)
### Google AI Studio Free-Tier Migration of Google Cloud Roadshow Lab 1

A production-ready Multi-Agent system that orchestrates specialized AI agents (**Curriculum Researcher**, **Judge/Evaluator**, and **Content Builder**) using deterministic control loops (**LoopAgent** and **SequentialAgent**).

This project migrates the [Google Cloud Production-Ready AI Roadshow Codelab](https://codelabs.developers.google.com/codelabs/production-ready-ai-roadshow/1-building-a-multi-agent-system/building-a-multi-agent-system#1) from Vertex AI (which requires Google Cloud Billing, a GCP Project, and Service Accounts) to **Google AI Studio's free tier** using the standard `@google/genai` SDK and `gemini-3.8-flash`.

---

## 🌐 Live Access URLs

You can access and test the live running application from anywhere on any browser or mobile device:

- **Shared / Public Live URL:** [https://ais-pre-vpzocurrh32bfbh2gqkrc4-332696288402.europe-west1.run.app](https://ais-pre-vpzocurrh32bfbh2gqkrc4-332696288402.europe-west1.run.app)
- **Dev Live URL:** [https://ais-dev-vpzocurrh32bfbh2gqkrc4-332696288402.europe-west1.run.app](https://ais-dev-vpzocurrh32bfbh2gqkrc4-332696288402.europe-west1.run.app)

---

## 🚀 How to Push this Project to Your GitHub

Follow these steps to initialize Git and push the entire codebase to your personal GitHub repository:

```bash
# 1. Initialize git in the workspace (if not already initialized)
git init

# 2. Stage all files (node_modules and dist are automatically ignored)
git add .

# 3. Commit your changes
git commit -m "feat: complete multi-agent system migrated to Google AI Studio free tier"

# 4. Create a new repository on GitHub (e.g. 'multi-agent-course-creator')
# Then link your remote and push:
git branch -M main
git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/<YOUR-REPO-NAME>.git
git push -u origin main
```

---

## ⚡ Multi-Agent Architecture

```
                               ┌───────────────────────────────────────────────┐
                               │            LoopAgent (Refinement)             │
                               │                                               │
  ┌───────────────┐            │  ┌───────────────┐       ┌─────────────────┐  │            ┌─────────────────┐
  │   User Spec   │ ─────────► │  │  Researcher   │ ────► │   Judge Agent   │  │ ─────────► │ Content Builder │
  │ (Topic/Level) │            │  │     Agent     │ ◄──── │ (Rubric Scoring)│  │ (Passed)   │      Agent      │
  └───────────────┘            │  └───────────────┘       └─────────────────┘  │            └────────┬────────┘
                               │        ▲                  Score < Threshold   │                     │
                               │        └──────────────────────────────────────┘                     ▼
                               └───────────────────────────────────────────────┘            ┌─────────────────┐
                                                                                            │ Complete Course │
                                                                                            │ (Code, Quizzes) │
                                                                                            └─────────────────┘
```

1. **Researcher Agent:** Performs curriculum decomposition, maps Bloom's taxonomy objectives, notes prerequisites, and plans hands-on coding demonstrations.
2. **Judge Agent:** Evaluates proposed syllabi across 4 rubrics (*Completeness*, *Pedagogical Flow*, *Actionability/Code*, *Clarity*) out of 100 points. Generates constructive, actionable feedback if the score is below the passing threshold.
3. **LoopAgent:** Executes a feedback loop between Researcher and Judge until passing score is achieved or max iterations are reached.
4. **Content Builder Agent:** Converts the approved research dossier into full theory, working code walkthroughs, exercises with solutions, self-assessment quizzes, and capstone briefs.

---

## 🔑 Key Differences: Vertex AI vs. Google AI Studio

| Feature | Vertex AI (Roadshow Lab) | Google AI Studio (This Project) |
| :--- | :--- | :--- |
| **GCP Billing** | Mandatory (Credit Card required) | **100% Free** (No credit card or billing setup) |
| **Authentication** | Service Account JSON / ADC | Simple API Key (`GEMINI_API_KEY`) |
| **SDK** | `@google-cloud/vertexai` | `@google/genai` (v2.4+) or `google-genai` (Python) |
| **Model** | `gemini-1.5-pro` | `gemini-3.8-flash` (Fast, high-quality, structured output) |
| **Orchestration** | Vertex AI Agent Builder | Pure, deterministic code (TypeScript & Python) |

---

## 💻 Running Locally

### Option A: Full-Stack Web App (Node.js & Vite)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<YOUR-USERNAME>/<YOUR-REPO>.git
   cd <YOUR-REPO>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY="your-free-key-from-aistudio.google.com"
   PORT=3000
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

5. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

---

### Option B: Standalone Python Script (CLI)

You can run the multi-agent system directly in Python with zero web dependencies:

1. **Install dependencies:**
   ```bash
   pip install google-genai pydantic
   ```

2. **Export your API key & run:**
   ```bash
   export GEMINI_API_KEY="your-free-key-from-aistudio.google.com"
   python scripts/multi_agent_system.py
   ```

---

## 🛠 Project Structure

```
├── server.ts                    # Express full-stack entry point (SSE streaming, Vite middleware)
├── server/
│   └── agents.ts                # Core multi-agent logic (Researcher, Judge, Content Builder, LoopAgent)
├── scripts/
│   └── multi_agent_system.py    # Standalone pure Python implementation
├── src/
│   ├── App.tsx                  # Interactive Multi-Agent Control Deck & Live Runner
│   ├── components/
│   │   ├── Navbar.tsx           # Navigation & status bar
│   │   ├── AgentGraph.tsx       # Visual interactive multi-agent diagram
│   │   ├── RefinementHistoryView.tsx # Rubric scorecard & iteration comparison
│   │   ├── CourseContentView.tsx     # Course reader, interactive quiz & code exporter
│   │   ├── MigrationGuideView.tsx    # 5-step interactive codelab migration tutorial
│   │   └── CodeExporterView.tsx      # Copy & download Python/TypeScript scripts
│   ├── data/
│   │   └── codelabContent.ts    # Tutorial text, architectural explanations & code diffs
│   └── types.ts                 # Type definitions & structured JSON schemas
└── package.json
```

---

## 📜 License
Apache-2.0
