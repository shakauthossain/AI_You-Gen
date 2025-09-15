import google.generativeai as genai

def extract_text(response) -> str:
    if hasattr(response, "text") and isinstance(response.text, str):
        return response.text
    parts = []
    for c in getattr(response, "candidates", []) or []:
        for p in getattr(c, "content", {}).get("parts", []):
            if isinstance(p, dict) and "text" in p:
                parts.append(p["text"])
            elif hasattr(p, "text"):
                parts.append(p.text)
    return "\n".join(parts).strip()