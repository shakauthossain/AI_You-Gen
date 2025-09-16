import re

def parse_mcq_text(text: str) -> list[dict]:
    """Parse MCQ text into a list of MCQ dicts with number, question, options, and correct_answer."""
    mcqs = []
    pattern = re.compile(r"## MCQ\s*Question: (.*?)\nA\) (.*?)\nB\) (.*?)\nC\) (.*?)\nD\) (.*?)\nCorrect Answer: ([A-D])", re.DOTALL)
    for idx, match in enumerate(pattern.findall(text), 1):
        question, a, b, c, d, correct = match
        options = [a.strip(), b.strip(), c.strip(), d.strip()]
        mcqs.append({
            "number": idx,
            "question": question.strip(),
            "options": options,
            "correct_answer": correct.strip()
        })
    return mcqs
import google.generativeai as genai


import re

def extract_text(response) -> list[dict]:
    # Always try to return the first available text from the model response
    if hasattr(response, "text") and isinstance(response.text, str) and response.text.strip():
        return response.text.strip()
    candidates = getattr(response, "candidates", []) or []
    for c in candidates:
        content = getattr(c, "content", {})
        parts = content.get("parts", [])
        for p in parts:
            if isinstance(p, dict) and "text" in p and p["text"].strip():
                return p["text"].strip()
            elif hasattr(p, "text") and p.text.strip():
                return p.text.strip()
    return ""

    # Parse MCQs from text
    mcqs = []
    pattern = re.compile(r"## MCQ\s*Question: (.*?)\nA\) (.*?)\nB\) (.*?)\nC\) (.*?)\nD\) (.*?)\nCorrect Answer: ([A-D])", re.DOTALL)
    for idx, match in enumerate(pattern.findall(text), 1):
        question, a, b, c, d, correct = match
        options = [a.strip(), b.strip(), c.strip(), d.strip()]
        mcqs.append({
            "number": idx,
            "question": question.strip(),
            "options": options,
            "correct_answer": correct.strip()
        })
    return mcqs