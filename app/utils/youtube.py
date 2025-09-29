# app/utils/youtube.py
from datetime import timedelta
from urllib.error import HTTPError, URLError

from langchain_community.document_loaders import YoutubeLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
)

from config import EMBED_MODEL_NAME


def get_video_title(url: str) -> str:
    """
    Extract actual video title from YouTube URL using YoutubeLoader
    Returns the real video title, not just the video ID
    """
    try:
        # First attempt: Use YoutubeLoader with video info to get title
        loader = YoutubeLoader.from_youtube_url(
            url,
            add_video_info=True,  # This adds video metadata including title
            language=["en", "en-US"],
            translation=None,
            continue_on_failure=False,
        )
        docs = loader.load()
        
        # Extract title from metadata
        if docs and len(docs) > 0:
            metadata = docs[0].metadata
            title = metadata.get('title')
            if title and title.strip():
                print(f"Successfully extracted video title: {title}")
                return title.strip()
            
            # Check other possible title fields
            for title_field in ['title', 'video_title', 'name']:
                if metadata.get(title_field):
                    title = metadata[title_field].strip()
                    if title:
                        print(f"Extracted video title from {title_field}: {title}")
                        return title
        
        print("No title found in video metadata, trying alternative method...")
        
    except Exception as e:
        print(f"Primary title extraction failed: {e}")
    
    # Alternative method: Try with different loader settings
    try:
        print("Attempting alternative title extraction...")
        loader = YoutubeLoader.from_youtube_url(
            url,
            add_video_info=True,
            language=["en"],
            continue_on_failure=True,
        )
        docs = loader.load()
        if docs and docs[0].metadata.get('title'):
            title = docs[0].metadata['title'].strip()
            print(f"Alternative method extracted title: {title}")
            return title
            
    except Exception as e:
        print(f"Alternative title extraction failed: {e}")
    
    # Final fallback: extract video ID and return a descriptive name
    print("All title extraction methods failed, using video ID fallback...")
    import re
    video_id_match = re.search(r'(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)', url)
    if video_id_match:
        video_id = video_id_match.group(1)
        return f"YouTube Video ({video_id})"
    
    return "YouTube Video (Unknown ID)"


def _load_with_langchain(url: str, add_video_info: bool):
    """
    Use LangChain's YoutubeLoader. With add_video_info=False it avoids pytube
    and relies only on youtube-transcript-api (most reliable).
    """
    loader = YoutubeLoader.from_youtube_url(
        url,
        add_video_info=add_video_info,
        # Prefer these languages; tweak for your audience
        language=["en", "en-US"],
        translation=None,             # or "en" to force auto-translation if only non-English exists
        continue_on_failure=False,    # fail fast to surface clear errors
    )
    return loader.load()


def load_and_index(url: str):
    """
    1) Transcript-only load (avoids pytube). This usually returns Document(s)
       with metadata including 'start' when the transcript api provides timings.
    2) If you *want* extra video metadata, we can best-effort retry with
       add_video_info=True; but if that fails (e.g., pytube 400), we ignore it.
    3) Split, embed, and build FAISS index.
    """
    # 1) Reliable transcript-only path
    try:
        docs_raw = _load_with_langchain(url, add_video_info=False)
    except (TranscriptsDisabled, NoTranscriptFound, VideoUnavailable) as yt_err:
        raise RuntimeError(f"Transcript not available: {yt_err}") from yt_err
    except (HTTPError, URLError) as net_err:
        raise RuntimeError(f"Network error fetching transcript: {net_err}") from net_err
    except AttributeError as e:
        # Usually indicates a broken/outdated youtube-transcript-api import at runtime
        raise RuntimeError(
            "Transcript loader failed inside YoutubeLoader. "
            "Ensure 'youtube-transcript-api' (with hyphens) is installed and up to date."
        ) from e
    except Exception as e:
        raise RuntimeError(f"Failed to load transcript via YoutubeLoader: {e}") from e

    if not docs_raw:
        raise RuntimeError("No transcript text returned for this video.")

    # 2) Optional: enrich metadata (best-effort, may hit pytube issues)
    #    If this fails, we silently keep the transcript-only docs.
    try:
        _ = _load_with_langchain(url, add_video_info=True)
        # We don't merge here because current LangChain returns similar docs.
        # If you want to merge extra fields, do it explicitly.
    except Exception:
        pass  # Ignore; transcript docs are good enough

    # 3) Split + embed + index
    splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=150)
    docs = splitter.split_documents(docs_raw)
    if not docs:
        raise RuntimeError("Transcript split produced no documents.")

    embeddings = HuggingFaceEmbeddings(model_name=EMBED_MODEL_NAME)
    db = FAISS.from_documents(docs, embeddings)
    return docs, db


def build_snippet(doc, url: str):
    """
    Build a snippet with timestamped link if 'start' is present in doc.metadata.
    Works with the transcript-only path when timings are available.
    """
    meta = getattr(doc, "metadata", {}) or {}
    snippet = {"content": doc.page_content}
    start = meta.get("start")
    if start is not None:
        try:
            seconds = int(float(start))
            snippet["timestamp"] = str(timedelta(seconds=seconds))
            # Add a &t=SSs param to jump to the moment
            link_char = "&" if "?" in url else "?"
            snippet["link"] = f"{url}{link_char}t={seconds}s"
        except Exception:
            pass
    return snippet
