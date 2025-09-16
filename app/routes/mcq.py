from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
import google.generativeai as genai

from app.schemas import MCQRequest, MCQTextResponse
from app.cache import video_cache
from app.utils.llm import extract_text
from app.utils.mcq import MCQ_TEMPLATE
from app.utils.pdf_docx import mcqs_to_pdf, mcqs_to_docx

router = APIRouter()

@router.post("/generate", response_model=MCQTextResponse)
async def generate_mcqs(req: MCQRequest):
    url = str(req.url)
    if url not in video_cache:
        raise HTTPException(status_code=404, detail="Transcript not loaded.")
    docs = video_cache[url]["docs"]

    def work():  # <-- sync
        text = " ".join(doc.page_content for doc in docs)
        prompt = MCQ_TEMPLATE.format(num=req.num_mcqs) + "\n\nSource:\n" + text[:200000]
        model = genai.GenerativeModel("gemini-2.0-flash")
        resp = model.generate_content(prompt)
        mcq_text = extract_text(resp)
        from app.utils.llm import parse_mcq_text
        mcqs = parse_mcq_text(mcq_text)
        return {"mcqs": mcqs}

    return await run_in_threadpool(work)


@router.post("/download/pdf")
async def download_pdf(req: MCQRequest):
    # generate_mcqs returns a dict (not a coroutine) because it awaits run_in_threadpool internally
    data = await generate_mcqs(req)
    return mcqs_to_pdf(data["mcqs"])

@router.post("/download/docx")
async def download_docx(req: MCQRequest):
    data = await generate_mcqs(req)
    return mcqs_to_docx(data["mcqs"])