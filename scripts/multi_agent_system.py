"""
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

Run locally with:
    pip install google-genai pydantic
    export GEMINI_API_KEY="your-free-api-key"
    python scripts/multi_agent_system.py
"""

import os
import json
import time
from typing import List, Optional
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

# 1. Initialize client using the free Gemini API key
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("Warning: GEMINI_API_KEY environment variable is not set.")
    print("Get your free key from https://aistudio.google.com")

client = genai.Client(api_key=api_key)

# Candidate free-tier models for high availability:
CANDIDATE_MODELS = [
    "gemini-3.1-flash-lite-preview",
    "gemini-3.8-flash",
    "gemini-flash-latest",
]

def generate_with_fallback(prompt: str, system_instruction: str, response_schema, temperature: float = 0.5):
    """
    Attempts generation across free-tier candidate models, automatically failing over
    if a model experiences temporary high demand (503).
    """
    last_err = None
    for model_name in CANDIDATE_MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=response_schema,
                    temperature=temperature,
                ),
            )
            return response
        except Exception as e:
            last_err = e
            print(f"    [Failover Notice] Model '{model_name}' busy, trying next engine...")
            time.sleep(1)
    raise last_err or RuntimeError("All candidate models failed.")


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
    response = generate_with_fallback(prompt, system_instruction, ResearchDossier, temperature=0.7)
    return ResearchDossier.model_validate_json(response.text)


# =====================================================================
# AGENT 2: Judge Agent (Evaluator)
# =====================================================================
def run_judge_agent(dossier: ResearchDossier, passing_score: int = 80) -> JudgeEvaluation:
    system_instruction = f"""You are a strict, objective Academic Reviewer and Senior Curriculum Architect.
Evaluate the provided Research Dossier against the 4 rubrics (25 pts each = 100 max).

Passing Threshold: {passing_score}/100.
If total_score >= {passing_score}, mark passed = True. Otherwise passed = False.
Provide clear, constructive, bulleted 'actionable_feedback' for any flaws.
"""
    prompt = f"Evaluate this curriculum dossier:\n\n{dossier.model_dump_json(indent=2)}"
    response = generate_with_fallback(prompt, system_instruction, JudgeEvaluation, temperature=0.2)
    eval_result = JudgeEvaluation.model_validate_json(response.text)
    eval_result.passed = eval_result.total_score >= passing_score
    return eval_result


# =====================================================================
# AGENT 3: Content Builder Agent
# =====================================================================
def run_content_builder_agent(dossier: ResearchDossier) -> FinalCourse:
    system_instruction = """You are a Master Technical Author and Educator.
Build out complete, in-depth course materials from the approved research plan.
Include fully documented, syntactically clean code walkthroughs and interactive exercises.
"""
    prompt = f"Write the full course curriculum based on this approved dossier:\n\n{dossier.model_dump_json(indent=2)}"
    response = generate_with_fallback(prompt, system_instruction, FinalCourse, temperature=0.6)
    return FinalCourse.model_validate_json(response.text)


# =====================================================================
# ORCHESTRATOR: LoopAgent & Sequential Pipeline
# =====================================================================
def run_multi_agent_system(topic: str, audience: str = "Intermediate Software Engineers", passing_score: int = 80, max_iterations: int = 3):
    print(f"=== Multi-Agent System Initializing ===")
    print(f"Topic: {topic} | Audience: {audience}")
    print(f"Engine: Google AI Studio - Free Tier\n")

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
    print("\n--> [Sequential Pipeline] Handing off to Content Builder Agent...")
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
