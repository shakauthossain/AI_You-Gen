from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from langchain_community.document_loaders import YoutubeLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.chains.llm import LLMChain
from langchain.prompts import PromptTemplate
from langchain.prompts import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate
)
from fpdf import FPDF
from docx import Document
from io import BytesIO
from fastapi.responses import StreamingResponse
import textwrap
from datetime import timedelta
from dotenv import load_dotenv
import os

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not set in .env file.")
genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI()


# In-memory cache for loaded transcripts and vector DBs
video_cache = {}

class VideoURLRequest(BaseModel):
    url: str

class QuestionRequest(BaseModel):
    url: str
    question: str

class MCQRequest(BaseModel):
    url: str
    num_mcqs: int = 5

@app.post("/load_transcript")
def load_transcript(req: VideoURLRequest):
    try:
        loader = YoutubeLoader.from_youtube_url(req.url)
        transcript = loader.load()
        splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=100)
        docs = splitter.split_documents(transcript)
        db = FAISS.from_documents(docs, HuggingFaceEmbeddings())
        video_cache[req.url] = {"db": db, "docs": docs}
        return {"message": "Transcript loaded successfully."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to load transcript: {e}")

@app.post("/ask_question")
def ask_question(req: QuestionRequest):
    if req.url not in video_cache:
        raise HTTPException(status_code=404, detail="Transcript not loaded for this URL.")
    db = video_cache[req.url]["db"]
    results = db.similarity_search(req.question, k=4)
    docs_page_content = " ".join([doc.page_content for doc in results])

    prompt = f"""
You are a helpful assistant answering questions about a YouTube video transcript.\nUse only the factual information from the transcript to answer the question.\n\nTranscript: {docs_page_content}\nIf unsure, say \"I don't know.\"\n\nAnswer the following question: {req.question}
"""
    model = genai.GenerativeModel("gemini-pro")
    response = model.generate_content(prompt)
    answer = response.text.strip()
    snippets = []
    for i, doc in enumerate(results):
        meta = doc.metadata
        snippet = {"content": doc.page_content}
        if 'start' in meta:
            t = str(timedelta(seconds=int(float(meta['start']))))
            link = f"{req.url}&t={int(float(meta['start']))}s"
            snippet["timestamp"] = t
            snippet["link"] = link
        snippets.append(snippet)
    return {"answer": answer, "snippets": snippets}

@app.post("/generate_mcqs")
def generate_mcqs(req: MCQRequest):
    if req.url not in video_cache:
        raise HTTPException(status_code=404, detail="Transcript not loaded for this URL.")
    docs = video_cache[req.url]["docs"]
    full_text = " ".join([doc.page_content for doc in docs])
    mcq_prompt = PromptTemplate(
        input_variables=["context", "num_questions"],
        template="""
You are an AI assistant helping the user generate multiple-choice questions (MCQs) from the text below:

Text:
{context}

Generate {num_questions} MCQs. Each should include:
- A clear question
- Four answer options labeled A, B, C, and D
- The correct answer clearly indicated at the end

Format:
## MCQ
Question: [question]
A) [option A]
B) [option B]
C) [option C]
D) [option D]
Correct Answer: [correct option]
"""
    )
    prompt = mcq_prompt.format(context=full_text, num_questions=req.num_mcqs)
    model = genai.GenerativeModel("gemini-pro")
    response = model.generate_content(prompt)
    mcqs = response.text.strip()
    return {"mcqs": mcqs}

@app.post("/download_mcqs_pdf")
def download_mcqs_pdf(req: MCQRequest):
    if req.url not in video_cache:
        raise HTTPException(status_code=404, detail="Transcript not loaded for this URL.")
    docs = video_cache[req.url]["docs"]
    full_text = " ".join([doc.page_content for doc in docs])
    mcq_prompt = PromptTemplate(
        input_variables=["context", "num_questions"],
        template="""
You are an AI assistant helping the user generate multiple-choice questions (MCQs) from the text below:

Text:
{context}

Generate {num_questions} MCQs. Each should include:
- A clear question
- Four answer options labeled A, B, C, and D
- The correct answer clearly indicated at the end

Format:
## MCQ
Question: [question]
A) [option A]
B) [option B]
C) [option C]
D) [option D]
Correct Answer: [correct option]
"""
    )
    prompt = mcq_prompt.format(context=full_text, num_questions=req.num_mcqs)
    model = genai.GenerativeModel("gemini-pro")
    response = model.generate_content(prompt)
    mcqs = response.text.strip()
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_font("Arial", size=12)
    for mcq in mcqs.split("## MCQ"):
        pdf.multi_cell(0, 10, mcq.strip() + "\n", align='L')
    pdf_bytes = pdf.output(dest='S').encode('latin-1')
    return StreamingResponse(BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=mcqs_output.pdf"})

@app.post("/download_mcqs_docx")
def download_mcqs_docx(req: MCQRequest):
    if req.url not in video_cache:
        raise HTTPException(status_code=404, detail="Transcript not loaded for this URL.")
    docs = video_cache[req.url]["docs"]
    full_text = " ".join([doc.page_content for doc in docs])
    mcq_prompt = PromptTemplate(
        input_variables=["context", "num_questions"],
        template="""
You are an AI assistant helping the user generate multiple-choice questions (MCQs) from the text below:

Text:
{context}

Generate {num_questions} MCQs. Each should include:
- A clear question
- Four answer options labeled A, B, C, and D
- The correct answer clearly indicated at the end

Format:
## MCQ
Question: [question]
A) [option A]
B) [option B]
C) [option C]
D) [option D]
Correct Answer: [correct option]
"""
    )
    prompt = mcq_prompt.format(context=full_text, num_questions=req.num_mcqs)
    model = genai.GenerativeModel("gemini-pro")
    response = model.generate_content(prompt)
    mcqs = response.text.strip()
    docx_file = BytesIO()
    doc = Document()
    for mcq in mcqs.split("## MCQ"):
        doc.add_paragraph(mcq.strip())
    doc.save(docx_file)
    docx_file.seek(0)
    return StreamingResponse(docx_file, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", headers={"Content-Disposition": "attachment; filename=mcqs_output.docx"})
