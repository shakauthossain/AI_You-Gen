from langchain.document_loaders import YoutubeLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings.huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain.vectorstores import FAISS
from langchain.chains import LLMChain
from langchain.prompts.chat import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate
)
import textwrap

# Initialize embeddings
embeddings = HuggingFaceEmbeddings()

# Create FAISS vector DB from YouTube transcript
def create_db_from_youtube_video_url(video_url):
    loader = YoutubeLoader.from_youtube_url(video_url)
    transcript = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=100)
    docs = text_splitter.split_documents(transcript)

    db = FAISS.from_documents(docs, embeddings)
    return db

# Ask questions against the vector DB
def get_response_from_query(db, query, k=4):
    docs = db.similarity_search(query, k=k)
    docs_page_content = " ".join([d.page_content for d in docs])

    chat = ChatGroq(
        api_key="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",  # Replace with your actual key
        model="llama-3.3-70b-versatile",
        temperature=0.5
    )

    system_template = """You are a helpful assistant that can answer questions about YouTube videos
    based on the video's transcript: {docs}

    Only use the factual information from the transcript to answer the question.

    If you feel like you don't have enough information to answer the question, say "I don't know"."""

    system_message_prompt = SystemMessagePromptTemplate.from_template(system_template)
    human_template = "Answer the following question: {question}"
    human_message_prompt = HumanMessagePromptTemplate.from_template(human_template)

    chat_prompt = ChatPromptTemplate.from_messages([system_message_prompt, human_message_prompt])

    chain = LLMChain(llm=chat, prompt=chat_prompt)

    response = chain.run(question=query, docs=docs_page_content)
    response = response.replace("\n", "")

    return response, docs

# Main function
def main():
    video_url = input("Enter YouTube video URL: ").strip()
    query = input("Enter your question about the video: ").strip()

    print("\n[INFO] Loading and processing the video...")
    db = create_db_from_youtube_video_url(video_url)

    print("[INFO] Querying the video content...")
    response, docs = get_response_from_query(db, query)

    print("\n=== Answer ===")
    print(textwrap.fill(response, width=70))

    print("\n=== Relevant Transcript Snippets ===")
    for i, doc in enumerate(docs):
        print(f"\n--- Snippet {i+1} ---")
        print(textwrap.fill(doc.page_content, width=70))

if __name__ == "__main__":
    main()
