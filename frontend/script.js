// Resume Analysis
function analyzeResume() {
    let resumeFile = document.getElementById("resumeUpload").files[0];
    let jobDescription = document.getElementById("jobDescription").value;
    if (!resumeFile || !jobDescription) {
        document.getElementById("resumeFeedback").innerText = "Upload resume & job description.";
        return;
    }
    document.getElementById("resumeFeedback").innerText = "Analyzing... Please wait.";
}

// AI HR Bot
function sendMessage(event) {
    if (event.key && event.key !== "Enter") return;
    let userMessage = document.getElementById("userInput").value;
    if (!userMessage.trim()) return;
    
    let chatbox = document.getElementById("chatbox");
    chatbox.innerHTML += `<p><b>You:</b> ${userMessage}</p>`;
    document.getElementById("userInput").value = "";

    setTimeout(() => {
        chatbox.innerHTML += `<p><b>AI:</b> Processing your question...</p>`;
    }, 1000);
}

// Mock Interviews
function startMockInterview() {
    let questions = ["Tell me about yourself.", "Why do you want this job?"];
    document.getElementById("questionDisplay").innerText = questions[Math.floor(Math.random() * questions.length)];
}

// Performance Feedback
function getFeedback() {
    document.getElementById("feedbackResults").innerText = "AI Feedback: Improve technical answers.";
}
