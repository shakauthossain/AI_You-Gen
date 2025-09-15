from fastapi import APIRouter, HTTPException
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
        return {"message": "Transcript loaded successfully."}
    return await run_in_threadpool(work)