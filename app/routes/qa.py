from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
import google.generativeai as genai

from app.schemas import QuestionRequest, QAResponse
from app.cache import video_cache
from app.utils.llm import extract_text
from app.utils.youtube import build_snippet

router = APIRouter()

@router.post("/ask", response_model=QAResponse)
async def ask_question(req: QuestionRequest):
    url = str(req.url)
    if url not in video_cache:
        raise HTTPException(status_code=404, detail="Transcript not loaded.")
    db = video_cache[url]["db"]

    def work():  # <-- sync
        results = db.similarity_search(req.question, k=4)
        context = " ".join(doc.page_content for doc in results)
        print(f"[QA/ASK] Context for prompt: {context[:500]}...")
        prompt = f"""You are a helpful assistant...
Transcript:
{context}

Question: {req.question}
Answer:"""
        model = genai.GenerativeModel("gemini-2.0-flash")
        resp = model.generate_content(prompt)
        print(f"[QA/ASK] Raw model response: {resp}")
        answer = extract_text(resp) or "I don't know."
        print(f"[QA/ASK] Extracted answer: {answer}")
        snippets = [build_snippet(doc, url) for doc in results]
        return {"answer": answer, "snippets": snippets}

    return await run_in_threadpool(work)