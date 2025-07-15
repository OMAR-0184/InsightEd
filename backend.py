from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import os
from langchain_community.document_loaders import PyPDFLoader
from model import quiz, summarize # Ensure these are correctly imported
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()


UPLOAD_DIR = "./uploaded_pdfs"
os.makedirs(UPLOAD_DIR, exist_ok=True)


origins = [
    "*"  # This wildcard allows all origins
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Set to ["*"] to allow all origins
    allow_credentials=True,      # Allow cookies/authorization headers to be sent
    allow_methods=["*"],         # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],         # Allow all headers
)
# --- END CORS Configuration ---

# Mount the static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- Define Pydantic Models for Request Bodies ---
class GenerateSummaryRequest(BaseModel):
    filename: str

class GenerateQuizRequest(BaseModel):
    filename: str
    num: int
# --- END Pydantic Models ---

@app.get("/")
def read_root():
    return {"message": "Welcome to the API. Access the frontend via Live Server or directly at /static/index.html"}

@app.post("/upload/")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    return {"message": "File uploaded successfully", "filename": file.filename}


@app.post("/generate/summary/")
async def generate_summary_endpoint(request: GenerateSummaryRequest):
    file_path = os.path.join(UPLOAD_DIR, request.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found.")

    loader = PyPDFLoader(file_path)
    summary = summarize(loader)
    return JSONResponse(content={"filename": request.filename, "summary": summary})


@app.post("/generate/quiz/") 
async def post_quiz_results(request: GenerateQuizRequest): # Changed name to reflect posting results
    file_path = os.path.join(UPLOAD_DIR, request.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found.")

    loader = PyPDFLoader(file_path)
    quiz_data = quiz(request.num, loader)
    return JSONResponse(content={"filename": request.filename, "questions": quiz_data})