let resumeText = "";
let jobRole = "";
let chatHistory = [];

// Upload Resume
document.getElementById("uploadBtn").addEventListener("click", async () => {
    console.log("Upload button clicked!");
    const file = document.getElementById("resumeUpload").files[0];
    if (file) {
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/upload-resume", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (data.resume_text) {
                resumeText = data.resume_text;
                document.getElementById("uploadStatus").textContent = "Resume uploaded successfully!";
                console.log("Resume text extracted:", resumeText);
            } else {
                document.getElementById("uploadStatus").textContent = "Error uploading resume.";
            }
        } catch (error) {
            console.error("Error uploading resume:", error);
            document.getElementById("uploadStatus").textContent = "Error uploading resume.";
        }
    } else {
        document.getElementById("uploadStatus").textContent = "No file selected.";
    }
});

// Set Job Role
document.getElementById("setJobRoleBtn").addEventListener("click", () => {
    console.log("Set Job Role button clicked!");
    jobRole = document.getElementById("jobRole").value;
    if (jobRole) {
        document.getElementById("jobRoleStatus").textContent = `Job role set: ${jobRole}`;
        console.log("Job role set:", jobRole);
    } else {
        document.getElementById("jobRoleStatus").textContent = "Please enter a job role.";
    }
});

// Start Mock Interview
document.getElementById("startInterviewBtn").addEventListener("click", async () => {
    console.log("Start Interview button clicked!");
    if (!resumeText || !jobRole) {
        alert("Please upload your resume and enter a job role.");
        return;
    }

    try {
        const response = await fetch("/start-interview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resume_text: resumeText, job_role: jobRole }),
        });

        const data = await response.json();
        if (data.response) {
            document.getElementById("interviewerQuestion").textContent = data.response;
            document.getElementById("interviewSection").style.display = "block";
            chatHistory = data.chat_history;
        }
    } catch (error) {
        console.error("Error starting interview:", error);
        alert("Error starting interview. Please try again.");
    }
});

// Function to generate feedback
async function generateFeedback(question, userInput) {
    try {
        const response = await fetch("/generate-feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_input: userInput, question: question }),
        });

        const data = await response.json();
        return data.feedback;
    } catch (error) {
        console.error("Error generating feedback:", error);
        return "Error generating feedback. Please try again.";
    }
}

// Submit Response
document.getElementById("submitResponseBtn").addEventListener("click", async () => {
    console.log("Submit Response button clicked!");
    const userInput = document.getElementById("userResponse").value;
    const question = document.getElementById("interviewerQuestion").textContent;

    if (!userInput) {
        alert("Please enter your response.");
        return;
    }

    try {
        // Submit the response and get the next question
        const response = await fetch("/submit-response", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_input: userInput, chat_history: chatHistory }),
        });

        const data = await response.json();
        if (data.response) {
            document.getElementById("interviewerQuestion").textContent = data.response;
            chatHistory = data.chat_history;
            document.getElementById("userResponse").value = ""; // Clear input

            // Generate and display feedback
            const feedback = await generateFeedback(question, userInput);
            const feedbackElement = document.createElement("div");
            feedbackElement.innerHTML = `<h3>Feedback:</h3><pre>${feedback}</pre>`;
            document.getElementById("feedbackSection").appendChild(feedbackElement);
        }
    } catch (error) {
        console.error("Error submitting response:", error);
        alert("Error submitting response. Please try again.");
    }
});

// Real-time feedback as the user types
document.getElementById("userResponse").addEventListener("input", async (event) => {
    const userInput = event.target.value;
    const question = document.getElementById("interviewerQuestion").textContent;

    if (userInput.length > 10) {  // Only generate feedback if the response is long enough
        const feedback = await generateFeedback(question, userInput);
        document.getElementById("feedbackSection").innerHTML = `<h3>Feedback:</h3><pre>${feedback}</pre>`;
    }
});

// Stop Interview
document.getElementById("stopInterviewBtn").addEventListener("click", () => {
    console.log("Stop Interview button clicked!");
    document.getElementById("interviewSection").style.display = "none";
    document.getElementById("interviewerQuestion").textContent = "";
    document.getElementById("userResponse").value = "";
    document.getElementById("feedbackSection").innerHTML = ""; // Clear feedback
    chatHistory = [];
});

// Toggle Resume Text
document.getElementById("toggleResumeTextBtn").addEventListener("click", () => {
    console.log("Toggle Resume Text button clicked!");
    const resumeTextElement = document.getElementById("resumeText");
    if (resumeTextElement.style.display === "none") {
        resumeTextElement.textContent = resumeText;
        resumeTextElement.style.display = "block";
    } else {
        resumeTextElement.style.display = "none";
    }
});