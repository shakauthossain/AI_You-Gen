import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.routes import transcript, qa, mcq
from app.auth import get_current_user

app = FastAPI(
    title="YT Q&A + MCQ Generator",
    version="1.1.0",
    dependencies=[Depends(get_current_user)]  # Require Clerk auth globally
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(transcript.router, prefix="/transcript", tags=["Transcript"])
app.include_router(qa.router, prefix="/qa", tags=["Q&A"])
app.include_router(mcq.router, prefix="/mcq", tags=["MCQs"])

@app.get("/protected")
def protected_route(user=Depends(get_current_user)):
    return {"message": "This is protected", "user": user}