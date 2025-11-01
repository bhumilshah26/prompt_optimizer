import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import openai
from fastapi.middleware.cors import CORSMiddleware
import json

# Load environment variables
load_dotenv()

# --- App and Middleware Setup ---
app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- OpenAI Client Initialization ---
try:
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
except Exception as e:
    print(f"Error initializing OpenAI client: {e}")
    client = None

# --- Pydantic Models ---
class PromptGenerationRequest(BaseModel):
    goal: str
    text_data: str

class LLMRequest(BaseModel):
    prompt: str

class FeedbackRequest(BaseModel):
    prompt: str
    response: str
    rating: int
    goal: str

# --- Meta-Prompt for Generating Prompt Variations ---
# THIS TEMPLATE IS NOW FIXED
PROMPT_TEMPLATE = """
You are a world-class prompt engineering expert. Your mission is to generate 3-4 diverse and effective prompt variations to accomplish a user's goal based on their provided text.

Consider different powerful techniques:
- **Persona:** Assigning a role to the AI (e.g., "You are an expert copywriter...").
- **Chain of Thought:** Asking the AI to think step-by-step.
- **Output Formatting:** Specifying the exact structure of the response (e.g., JSON, Markdown table).
- **Conciseness vs. Detail:** Creating prompts that ask for either a brief summary or a detailed explanation.

Here is the user's request:
---
**User Goal:** {goal}
**User Text Data:** "{text_data}"
---

You MUST return your answer as a single, valid JSON array of objects. Do not include any other text, explanation, or markdown formatting. The array should contain 3-4 prompt variations.

Each object in the JSON array must have two keys:
1.  `"strategy"`: A short, descriptive name for the prompt technique used (e.g., "Expert Persona", "Chain of Thought Reasoning").
2.  `"prompt"`: The full, ready-to-use text of the generated prompt.

[EXAMPLE of the required output format]
[
  {{
    "strategy": "Simple & Direct",
    "prompt": "Summarize the key findings from this text: [Text Data]"
  }},
  {{
    "strategy": "Legal Expert Persona",
    "prompt": "You are a legal expert. Analyze the following document and identify any potential liabilities. [Text Data]"
  }}
]
"""

# --- API Endpoints ---

@app.post("/generate_prompts")
async def generate_prompts_endpoint(request: PromptGenerationRequest):
    """
    Uses an LLM to generate a list of prompt variations (meta-prompting).
    """
    if not client:
        print("here")
        raise HTTPException(status_code=500, detail="OpenAI client not initialized.")
    
    meta_prompt = PROMPT_TEMPLATE.format(
        goal=request.goal,
        text_data=request.text_data
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": meta_prompt}
            ],
            response_format={"type": "json_object"},
        )
        
        prompt_variations_str = response.choices[0].message.content
        variations_data = json.loads(prompt_variations_str)

        if isinstance(variations_data, dict):
             key_with_list = next((k for k, v in variations_data.items() if isinstance(v, list)), None)
             if key_with_list:
                 variations = variations_data[key_with_list]
             else:
                 raise ValueError("JSON object returned, but no list of prompts found.")
        elif isinstance(variations_data, list):
            variations = variations_data
        else:
            raise ValueError("LLM did not return a valid JSON list or object containing a list.")

        return {"prompts": variations}

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse JSON response from the LLM.")
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"An API error occurred: {str(e)}")


@app.post("/get_llm_response")
async def get_llm_response_endpoint(request: LLMRequest):
    if not client:
        raise HTTPException(status_code=500, detail="OpenAI client not initialized.")
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": request.prompt}
            ]
        )
        return {"response": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")


@app.post("/submit_feedback")
async def submit_feedback_endpoint(request: FeedbackRequest):
    feedback_log = {
        "goal": request.goal,
        "prompt_used": request.prompt,
        "model_response": request.response,
        "user_rating": request.rating
    }
    
    with open("feedback_log.jsonl", "a") as f:
        f.write(json.dumps(feedback_log) + "\n")
        
    return {"message": "Feedback submitted successfully!"}


@app.get("/")
def read_root():
    return {"message": "Adaptive Prompt Optimizer Feedback API is running."}