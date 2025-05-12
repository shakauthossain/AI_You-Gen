import streamlit as st
import textwrap
from datetime import timedelta
from langchain.document_loaders import YoutubeLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings.huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain.vectorstores import FAISS
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.prompts.chat import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate
)

from fpdf import FPDF
from docx import Document
from io import BytesIO

# Streamlit config
st.set_page_config(page_title="YouTube Q&A + MCQ", layout="centered")
st.title("YouTube Video Q&A and MCQ Generator")

# LLM setup
chat = ChatGroq(
    api_key="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",  # Replace this with your Groq API key
    model="llama-3.3-70b-versatile",
    temperature=0.5
)

# Initialize session state
if "db" not in st.session_state:
    st.session_state.db = None
if "docs" not in st.session_state:
    st.session_state.docs = None

# -------- Video URL Input + Load Button ----------
st.markdown("### 1. Load YouTube Transcript")
with st.container():
    col1, col2 = st.columns([6, 1])
    with col1:
        video_url = st.text_input("Enter YouTube Video URL", label_visibility="collapsed", placeholder="https://www.youtube.com/watch?v=...")
    with col2:
        load_clicked = st.button("Load", use_container_width=True)

if load_clicked and video_url:
    with st.spinner("Loading transcript..."):
        try:
            loader = YoutubeLoader.from_youtube_url(video_url)
            transcript = loader.load()
            splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=100)
            docs = splitter.split_documents(transcript)
            db = FAISS.from_documents(docs, HuggingFaceEmbeddings())
            st.session_state.db = db
            st.session_state.docs = docs
            st.success("Transcript loaded successfully.")
        except Exception as e:
            st.error(f"Failed to load transcript: {e}")

# -------- Question Input + Get Answer Button ----------
st.markdown("### 2. Ask a Question")
with st.container():
    col3, col4 = st.columns([6, 1])
    with col3:
        query = st.text_input("Enter your question", label_visibility="collapsed", placeholder="e.g., What is this video about?")
    with col4:
        answer_clicked = st.button("Get Answer", use_container_width=True)

if answer_clicked:
    if not query:
        st.warning("Please enter a question.")
    elif not st.session_state.db:
        st.warning("Please load a transcript first.")
    else:
        with st.spinner("Finding answer..."):
            try:
                results = st.session_state.db.similarity_search(query, k=4)
                docs_page_content = " ".join([doc.page_content for doc in results])

                system_template = """You are a helpful assistant answering questions about a YouTube video transcript.
Use only the factual information from the transcript to answer the question.

Transcript: {docs}
If unsure, say "I don't know."
"""
                human_template = "Answer the following question: {question}"

                prompt = ChatPromptTemplate.from_messages([
                    SystemMessagePromptTemplate.from_template(system_template),
                    HumanMessagePromptTemplate.from_template(human_template)
                ])
                chain = LLMChain(llm=chat, prompt=prompt)

                answer = chain.run(question=query, docs=docs_page_content)
                st.success("Answer:")
                st.write(textwrap.fill(answer.strip(), width=80))

                with st.expander("Transcript Snippets Used"):
                    for i, doc in enumerate(results):
                        meta = doc.metadata
                        if 'start' in meta:
                            t = str(timedelta(seconds=int(float(meta['start']))))
                            link = f"{video_url}&t={int(float(meta['start']))}s"
                            st.markdown(f"**Snippet {i+1} at [`{t}`]({link}):**")
                        else:
                            st.markdown(f"**Snippet {i+1}:**")
                        st.info(textwrap.fill(doc.page_content, width=80))
            except Exception as e:
                st.error(f"Answering failed: {e}")

# -------- MCQ Generation Section ----------
st.markdown("---")
st.markdown("### 3. Generate MCQs from Transcript")
with st.container():
    col5, col6 = st.columns([6, 1])
    with col5:
        num_mcqs = st.slider("Number of MCQs", 1, 10, 5, label_visibility="collapsed")
    with col6:
        generate_mcqs = st.button("Generate MCQs", use_container_width=True)

if generate_mcqs:
    if not st.session_state.docs:
        st.warning("Please load the transcript first.")
    else:
        with st.spinner("Generating MCQs..."):
            try:
                full_text = " ".join([doc.page_content for doc in st.session_state.docs])
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

                chain = LLMChain(llm=chat, prompt=mcq_prompt)
                mcqs = chain.run(context=full_text, num_questions=num_mcqs).strip()

                st.success("MCQs Generated:")
                st.session_state.mcqs = mcqs  # Save for export
                for mcq in mcqs.split("## MCQ"):
                    if mcq.strip():
                        st.markdown(f"```{mcq.strip()}```")

                # Create PDF content
                pdf = FPDF()
                pdf.add_page()
                pdf.set_auto_page_break(auto=True, margin=15)
                pdf.set_font("Arial", size=12)
                for mcq in mcqs.split("## MCQ"):
                    pdf.multi_cell(0, 10, mcq.strip() + "\n", align='L')

                pdf_bytes = pdf.output(dest='S').encode('latin-1')  # Returns PDF bytes

                # Create DOCX content
                docx_file = BytesIO()
                doc = Document()
                for mcq in mcqs.split("## MCQ"):
                    doc.add_paragraph(mcq.strip())
                doc.save(docx_file)
                docx_file.seek(0)

                col1, col2 = st.columns(2)

                with col1:
                    st.download_button(
                        label="📄 Download as PDF",
                        data=pdf_bytes,
                        file_name="mcqs_output.pdf",
                        mime="application/pdf"
                    )

                with col2:
                    st.download_button(
                        label="📝 Download as DOCX",
                        data=docx_file,
                        file_name="mcqs_output.docx",
                        mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    )



            except Exception as e:
                st.error(f"MCQ generation failed: {e}")