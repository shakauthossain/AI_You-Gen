# app/utils/youtube.py
import re
from urllib.parse import urlparse, parse_qs
from urllib.error import HTTPError, URLError

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
)

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.docstore.document import Document

from app.config import EMBED_MODEL_NAME


YOUTUBE_ID_RE = re.compile(
    r"(?:v=|\/videos\/|embed\/|youtu\.be\/|\/v\/|\/shorts\/)([A-Za-z0-9_-]{11})"
)

def extract_video_id(url: str) -> str:
    # Try query param first (watch?v=ID)
    try:
        q = parse_qs(urlparse(url).query)
        if "v" in q and q["v"]:
            return q["v"][0]
    except Exception:
        pass
    # Fallback to regex for youtu.be, /embed/, /shorts/, etc.
    m = YOUTUBE_ID_RE.search(url)
    if m:
        return m.group(1)
    raise RuntimeError("Could not parse a valid YouTube video ID from the URL.")

def fetch_transcript_text(video_id: str, languages=None) -> str:
    languages = languages or ["en", "en-US"]
    try:
        # get_transcript works broadly and avoids list_transcripts path
        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=languages)
        # transcript is a list of {"text": "...", "start": <float>, "duration": <float>}
        text = "\n".join(chunk.get("text", "") for chunk in transcript if chunk.get("text"))
        if not text.strip():
            raise RuntimeError("Transcript returned empty text.")
        return text
    except NoTranscriptFound as e:
        raise RuntimeError("No transcript found for this video.") from e
    except TranscriptsDisabled as e:
        raise RuntimeError("Transcripts are disabled for this video.") from e
    except VideoUnavailable as e:
        raise RuntimeError("Video is unavailable.") from e
    except (HTTPError, URLError) as net_err:
        raise RuntimeError(f"Network error fetching transcript: {net_err}") from net_err
    except Exception as e:
        raise RuntimeError(f"Failed to fetch transcript: {e}") from e

def load_and_index(url: str):
    video_id = extract_video_id(url)
    full_text = fetch_transcript_text(video_id)

    splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=150)
    docs = splitter.create_documents([full_text])

    if not docs:
        raise RuntimeError("Transcript split produced no documents.")

    embeddings = HuggingFaceEmbeddings(model_name=EMBED_MODEL_NAME)
    db = FAISS.from_documents(docs, embeddings)
    return docs, db


def build_snippet(doc, url: str):
    meta = getattr(doc, "metadata", {}) or {}
    snippet = {"content": doc.page_content}
    if "start" in meta:
        seconds = int(float(meta["start"]))
        snippet["timestamp"] = str(timedelta(seconds=seconds))
        snippet["link"] = f"{url}&t={seconds}s"
    return snippet