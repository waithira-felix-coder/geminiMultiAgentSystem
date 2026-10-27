/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Express Server for the Multi-Agent System (Google AI Studio Edition)
 * 
 * Sets up server-side Gemini execution, SSE streaming for agent traces,
 * and mounts Vite development middleware.
 */

import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import {
  runSequentialCoursePipeline,
  runResearcherAgent,
  runJudgeAgent,
  runContentBuilderAgent,
  AgentExecutionEvent,
} from "./server/agents.ts";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";

app.use(express.json({ limit: "10mb" }));

// Status endpoint
app.get("/api/status", (_req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: "healthy",
    hasApiKey: hasKey,
    environment: isProduction ? "production" : "development",
    model: "gemini-3.8-flash",
  });
});

// SSE Streaming pipeline execution
app.post("/api/agents/run", async (req: Request, res: Response) => {
  const {
    topic,
    audience,
    passingScore = 80,
    maxIterations = 3,
    researcherInstructions,
    judgeNotes,
    contentFormatting,
  } = req.body;

  if (!topic || !audience) {
    res.status(400).json({ error: "Missing required fields: topic, audience" });
    return;
  }

  // Set headers for Server-Sent Events (SSE)
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const sendEvent = (event: AgentExecutionEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
    // Flush if method available
    if (typeof (res as any).flush === "function") {
      (res as any).flush();
    }
  };

  try {
    const result = await runSequentialCoursePipeline(topic, audience, {
      passingScore: Number(passingScore) || 80,
      maxIterations: Number(maxIterations) || 3,
      researcherInstructions,
      judgeNotes,
      contentFormatting,
      onEvent: sendEvent,
    });

    // Send final result package
    sendEvent({
      type: "pipeline_complete",
      data: result,
      message: "Pipeline completed successfully.",
    });

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("Agent pipeline error:", error);
    sendEvent({
      type: "error",
      message: error?.message || "An unexpected error occurred during agent execution",
      data: { stack: error?.stack },
    });
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

// Single step debugging endpoint
app.post("/api/agents/step", async (req: Request, res: Response) => {
  const { step, payload } = req.body;

  try {
    if (step === "researcher") {
      const { topic, audience, instructions, previousCritique, iteration } = payload;
      const result = await runResearcherAgent(topic, audience, instructions, previousCritique, iteration);
      res.json({ success: true, result });
      return;
    }

    if (step === "judge") {
      const { dossier, passingScore, rubricNotes } = payload;
      const result = await runJudgeAgent(dossier, passingScore, rubricNotes);
      res.json({ success: true, result });
      return;
    }

    if (step === "content_builder") {
      const { dossier, customFormatting } = payload;
      const result = await runContentBuilderAgent(dossier, customFormatting);
      res.json({ success: true, result });
      return;
    }

    res.status(400).json({ error: `Unknown agent step: ${step}` });
  } catch (err: any) {
    console.error("Step execution error:", err);
    res.status(500).json({ error: err.message || "Failed to execute step" });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
