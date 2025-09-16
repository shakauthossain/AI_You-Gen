
# Minimal test for langchain YoutubeLoader (updated import)
from langchain_community.document_loaders import YoutubeLoader

url = "https://www.youtube.com/watch?v=h1Q0K2arVdM"  # Replace with a known video with transcript
try:
    loader = YoutubeLoader.from_youtube_url(url, add_video_info=False)
    docs = loader.load()
    print(f"Loaded {len(docs)} document(s)")
    for doc in docs:
        print(doc.page_content[:500])  # Print first 500 chars of transcript
except Exception as e:
    print(f"YoutubeLoader test error: {e}")
