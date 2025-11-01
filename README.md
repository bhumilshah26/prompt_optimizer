# Adaptive Prompt Optimizer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.4-47A248?logo=mongodb)](https://www.mongodb.com/)

An intelligent full-stack application that dynamically generates and evaluates multiple LLM prompt strategies, creating a human-in-the-loop system to discover the most effective prompts for any given task.

### **Live Demo:** [https://prompt-optimizer-weld-three.vercel.app/](https://prompt-optimizer-weld-three.vercel.app/)

---

## The Problem

A single, static prompt is often not enough to get the best possible response from a Large Language Model. The quality of an LLM's output is highly dependent on the quality of the input prompt. Manually iterating on prompts is slow, inefficient, and lacks a systematic way to compare results.

## The Solution

This project introduces a "meta-prompting" system that uses an LLM to generate multiple, diverse prompt strategies based on a user's goal and input data. Users can then execute these prompts, compare the responses side-by-side, and provide feedback. This feedback is then stored in a **MongoDB** database, creating a valuable dataset for analyzing which prompt techniques work best for specific tasks.

## Key Features

-   **Dynamic Prompt Generation**: Uses a powerful "meta-prompt" to instruct an LLM (like GPT-4) to generate 3-4 diverse prompt variations (e.g., using personas, chain-of-thought, or specific output formats).
-   **Multi-Strategy Comparison**: A clean UI that allows users to test each generated prompt and see the corresponding LLM response.
-   **Human-in-the-Loop Feedback**: A star-rating system enables users to score the quality of each prompt-response pair.
-   **Persistent Data Storage**: All feedback—including the user's goal, the prompt strategy used, the model's response, and the user's rating—is stored in a **MongoDB** database for future analysis.
-   **Decoupled Architecture**: A robust Python **FastAPI** backend serves a modern **ReactJS** frontend, ensuring scalability and maintainability.

---

## How It Works

1.  **Input**: The user provides a high-level `Goal` and the `Text Data` to be processed.
2.  **Meta-Prompting**: The FastAPI backend injects the user's input into a "meta-prompt" and sends it to the OpenAI API.
3.  **Strategy Generation**: The LLM analyzes the meta-prompt and returns a JSON object containing several unique prompt strategies.
4.  **Display & Execution**: The React frontend displays these strategies. When a user clicks "Get Response" for a specific prompt, it's sent back to the backend.
5.  **LLM Response**: The backend sends the chosen prompt to the OpenAI API and returns the model's response to the frontend.
6.  **Feedback & Storage**: The user rates the outcome. This feedback is sent to a `/submit_feedback` endpoint, which then **persists the complete data object to a MongoDB collection**.

---

## Tech Stack

| Area      | Technology                                                                                                 |
| :-------- | :--------------------------------------------------------------------------------------------------------- |
| **Frontend**  | `React.js`, `CSS`                                                                                          |
| **Backend**   | `FastAPI`, `Python`, `Uvicorn`                                                                             |
| **Database**  | `MongoDB` (using `pymongo` driver)                                                                         |
| **AI Model**  | `OpenAI API (GPT-4o-mini)`                                                                                       |
| **Deployment**| `Vercel` (Frontend), `Render` (Backend & Database)                                                           |
