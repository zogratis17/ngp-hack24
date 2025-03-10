from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import os
import google.generativeai as genai
import PyPDF2
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the API key from environment variables
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Configure Gemini API
genai.configure(api_key=GOOGLE_API_KEY)

app = FastAPI()

# Serve static files (CSS, JS)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Extract text from uploaded PDF
def extract_text_from_pdf(uploaded_file):
    pdf_reader = PyPDF2.PdfReader(uploaded_file)
    extracted_text = ""
    for page in pdf_reader.pages:
        extracted_text += page.extract_text()
    return extracted_text

# Home route to serve the frontend
@app.get("/", response_class=HTMLResponse)
def home():
    with open("templates/index.html", "r") as file:
        return HTMLResponse(content=file.read())

# API endpoint to handle resume upload and text extraction
@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a PDF.")

    # Extract text from PDF
    resume_text = extract_text_from_pdf(file.file)

    # Analyze the resume using Gemini API
    model = genai.GenerativeModel("gemini-1.5-flash")
    prompt = f"""Analyze the following resume and provide:
    1. ATS Score (out of 100).
    2. Feedback on the resume.
    3. Overall Rating (Good, Bad, Needs Improvement).

    Resume:
    {resume_text}

    Provide the output in the following JSON format:
    {{
        "ats_score": "ATS Score",
        "feedback": "Feedback on the resume",
        "overall_rating": "Overall Rating"
    }}
    """
    response = model.generate_content(prompt)

    # Parse the response
    try:
        analysis = response.text  # Convert the response to a dictionary
    except:
        analysis = {
            "ats_score": "N/A",
            "feedback": "Unable to analyze the resume.",
            "overall_rating": "N/A"
        }

    return {"resume_text": resume_text, "analysis": analysis}

# API endpoint to start the mock interview
@app.post("/start-interview")
async def start_interview(data: dict):
    resume_text = data.get("resume_text")
    job_role = data.get("job_role")

    if not resume_text or not job_role:
        raise HTTPException(status_code=400, detail="Resume text and job role are required.")

    # Start a chat session with Gemini
    model = genai.GenerativeModel("gemini-1.5-flash")
    chat = model.start_chat(
        history=[
            {"role": "user", "parts": f"My resume: {resume_text}"},
            {"role": "user", "parts": f"I'm applying for the role of {job_role}. Start a mock interview. Do not mention the interviewer name."},
        ]
    )
    response = chat.send_message("Begin the interview.")

    # Extract only the necessary data from the Gemini response
    response_text = response.text
    chat_history = [
        {"role": message.role, "parts": message.parts[0].text}  # Extract role and text
        for message in chat.history
    ]

    return {"response": response_text, "chat_history": chat_history}

# API endpoint to handle user responses and generate follow-up questions
@app.post("/submit-response")
async def submit_response(data: dict):
    user_input = data.get("user_input")
    chat_history = data.get("chat_history")

    if not user_input or not chat_history:
        raise HTTPException(status_code=400, detail="User input and chat history are required.")

    # Continue the chat session with Gemini
    model = genai.GenerativeModel("gemini-1.5-flash")
    chat = model.start_chat(history=chat_history)
    response = chat.send_message(user_input)

    # Extract only the necessary data from the Gemini response
    response_text = response.text
    chat_history = [
        {"role": message.role, "parts": message.parts[0].text}  # Extract role and text
        for message in chat.history
    ]

    return {"response": response_text, "chat_history": chat_history}

# API endpoint to generate feedback
@app.post("/generate-feedback")
async def generate_feedback(data: dict):
    user_input = data.get("user_input")
    question = data.get("question")

    if not user_input or not question:
        raise HTTPException(status_code=400, detail="User input and question are required.")

    # Generate feedback using Gemini
    model = genai.GenerativeModel("gemini-1.5-flash")
    prompt = f"""Analyze the following interview response and provide feedback:
    Question: {question}
    Response: {user_input}

    Provide feedback in the following format:
    - What was done well: [positive feedback]
    - What can be improved: [constructive feedback]
    - Best way to present this answer: [suggestions]
    """
    response = model.generate_content(prompt)

    return {"feedback": response.text}

# Run the FastAPI app
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)