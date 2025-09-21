from app.utils.llm import extract_text
import google.generativeai as genai
from fastapi import APIRouter, HTTPException, Body
from fastapi.concurrency import run_in_threadpool
from typing import List, Dict
from fastapi.concurrency import run_in_threadpool
from app.schemas import VideoURLRequest, LoadResponse
from app.cache import video_cache
from app.utils.youtube import load_and_index

router = APIRouter()

@router.post("/load", response_model=LoadResponse)
async def load_transcript(req: VideoURLRequest):
    def work():
        try:
            docs, db = load_and_index(str(req.url))
        except RuntimeError as e:
            # Bad request if transcript missing / HTTP 400s / etc.
            raise HTTPException(status_code=400, detail=str(e))
        video_cache[str(req.url)] = {"docs": docs, "db": db}

        # Generate summary using LLM
        transcript_text = "\n".join(doc.page_content.strip() for doc in docs)
        prompt = f"""
You are a helpful assistant. Summarize the following YouTube video transcript in 3-5 sentences. Focus on the main topic, key points, and any important context. Do not reference the transcript directly or say 'this video'.

Transcript:
{transcript_text}

Summary:
"""
        try:
            model = genai.GenerativeModel("gemini-2.0-flash")
            resp = model.generate_content(prompt)
            from app.utils.llm import extract_text
            summary = extract_text(resp)
        except Exception as e:
            print(f"[SUMMARY] LLM summary generation failed: {e}")
            summary = None

        return {"message": "Transcript loaded successfully.", "summary": summary}
    return await run_in_threadpool(work)


@router.post("/clips")
async def suggest_clips(req: VideoURLRequest, num_clips: int = Body(3, embed=True)) -> Dict:
    url = str(req.url)
    if url not in video_cache:
        raise HTTPException(status_code=404, detail="Transcript not loaded.")
    docs = video_cache[url]["docs"]
    # Debug: print metadata of first 5 docs
    print("[CLIPS] Example doc metadata:")
    for i, doc in enumerate(docs[:5]):
        print(f"  Doc {i+1}: {getattr(doc, 'metadata', {})}")

    # Try to extract transcript with timestamps
    transcript_chunks = []
    for doc in docs:
        meta = getattr(doc, "metadata", {}) or {}
        start = meta.get("start")
        if start is not None:
            transcript_chunks.append({
                "start": float(start),
                "text": doc.page_content.strip()
            })
    if not transcript_chunks:
        # Fallback: Use only text highlights, no timestamps
        print("[CLIPS] No timestamps found, using fallback mode (text only).")
        transcript_text = "\n".join(doc.page_content.strip() for doc in docs)
        prompt = f"""
You are a video content assistant. From the transcript below, select the top {num_clips} most interesting or impactful moments (clips) for sharing. For each, return:
- A short title (3-8 words)
- The quoted text for the clip

Transcript:
{transcript_text}

Respond in JSON as a list of objects with keys: title, text.
"""
        model = genai.GenerativeModel("gemini-1.5-flash")
        resp = model.generate_content(prompt)
        clips_json = extract_text(resp)
        import json
        try:
            clips = json.loads(clips_json)
        except Exception:
            print("[CLIPS] LLM did not return valid JSON. Using fallback text splitting.")
            # Fallback: split transcript into N roughly equal parts as highlights
            all_text = transcript_text.strip().split("\n")
            chunk_size = max(1, len(all_text) // num_clips)
            clips = []
            for i in range(num_clips):
                start = i * chunk_size
                end = (i + 1) * chunk_size if i < num_clips - 1 else len(all_text)
                text = " ".join(all_text[start:end]).strip()
                if text:
                    clips.append({"title": f"Clip {i+1}", "text": text})
            if not clips:
                clips = [{"title": "Full Transcript", "text": transcript_text.strip()}]
        # Add a note to the response
        return {"clips": clips, "note": "Timestamps not available for this video. Only text highlights returned."}

    # Build a prompt for the LLM
    transcript_text = "\n".join(f"[{chunk['start']:.0f}s] {chunk['text']}" for chunk in transcript_chunks)
    prompt = f"""
You are a video content assistant. From the transcript below, select the top {num_clips} most interesting or impactful moments (clips) for sharing. For each, return:
- A short title (3-8 words)
- The start and end time in seconds (estimate end as start of next chunk or +30s if last)
- The quoted text for the clip

Transcript:
{transcript_text}

Respond in JSON as a list of objects with keys: title, start_time, end_time, text.
"""
    model = genai.GenerativeModel("gemini-1.5-flash")
    resp = model.generate_content(prompt)
    clips_json = extract_text(resp)
    import json
    try:
        clips = json.loads(clips_json)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to parse LLM response as JSON.")
    return clips

# Script/Blog Post Generator endpoint
@router.post("/blog")
async def generate_blog(req: VideoURLRequest, style: str = Body("blog", embed=True)) -> Dict:
    url = str(req.url)
    if url not in video_cache:
        raise HTTPException(status_code=404, detail="Transcript not loaded.")
    docs = video_cache[url]["docs"]
    transcript_text = "\n".join(doc.page_content.strip() for doc in docs)
    prompt = f"""
You are a content creator assistant. Write a detailed, engaging, and well-structured {style} post based on the following transcript. The output should be suitable for publishing as a blog post or video script, with clear sections, headings, and natural language. Do not reference the transcript directly.

Transcript:
{transcript_text}

Begin your {style} post below:
"""
    model = genai.GenerativeModel("gemini-1.5-flash")
    resp = model.generate_content(prompt)
    from app.utils.llm import extract_text
    blog = extract_text(resp)
    return {"style": style, "content": blog}