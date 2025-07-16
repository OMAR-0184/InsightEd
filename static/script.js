document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://insighted.onrender.com'; // Set the base URL for your FastAPI backend

    const uploadInput = document.getElementById('pdfUpload');
    const uploadButton = document.getElementById('uploadButton');
    const uploadStatus = document.getElementById('uploadStatus');
    const uploadedFilenameSelect = document.getElementById('uploadedFilename');
    const summarizeButton = document.getElementById('summarizeButton');
    const summaryResult = document.getElementById('summaryResult');
    const summaryContent = document.getElementById('summaryContent');
    const numQuestionsInput = document.getElementById('numQuestions');
    const generateQuizButton = document.getElementById('generateQuizButton');
    const quizGenerationStatus = document.getElementById('quizGenerationStatus');
    const quizSection = document.getElementById('quiz-section');
    const quizContainer = document.getElementById('quizContainer');
    const submitQuizButton = document.getElementById('submitQuizButton');
    const startNewQuizButton = document.getElementById('startNewQuizButton');
    const quizAnalysisSection = document.getElementById('quiz-analysis');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const correctList = document.getElementById('correctList');
    const incorrectList = document.getElementById('incorrectList');

    let currentQuizData = []; // To store the quiz questions and answers
    let selectedFilename = ''; // To store the currently selected filename

    // Function to fetch uploaded files and populate the dropdown
    async function fetchUploadedFiles() {
        try {
            // In a real application, you'd have an endpoint to list uploaded files.
            // For this example, we'll assume the client "remembers" uploaded files
            // or the server provides a way to list them.
            // For now, we'll just populate it if a file was just uploaded.
            // A more robust solution would involve a backend endpoint that lists files in UPLOAD_DIR.
            // Since there's no backend endpoint to list files, we'll manually add the last uploaded file.
            // This is a simplification for demonstration.
            if (localStorage.getItem('uploadedFiles')) {
                const files = JSON.parse(localStorage.getItem('uploadedFiles'));
                uploadedFilenameSelect.innerHTML = ''; // Clear previous options
                if (files.length === 0) {
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = 'No files uploaded yet.';
                    option.disabled = true;
                    option.selected = true;
                    uploadedFilenameSelect.appendChild(option);
                    summarizeButton.disabled = true;
                    generateQuizButton.disabled = true;
                } else {
                    files.forEach(filename => {
                        const option = document.createElement('option');
                        option.value = filename;
                        option.textContent = filename;
                        uploadedFilenameSelect.appendChild(option);
                    });
                    uploadedFilenameSelect.selectedIndex = 0; // Select the first one
                    selectedFilename = uploadedFilenameSelect.value;
                    summarizeButton.disabled = false;
                    generateQuizButton.disabled = false;
                }
            } else {
                uploadedFilenameSelect.innerHTML = '<option value="" disabled selected>No files uploaded yet.</option>';
                summarizeButton.disabled = true;
                generateQuizButton.disabled = true;
            }
        } catch (error) {
            console.error('Error fetching uploaded files:', error);
            uploadedFilenameSelect.innerHTML = '<option value="" disabled selected>Error loading files.</option>';
        }
    }

    // Call this on page load
    fetchUploadedFiles();

    uploadedFilenameSelect.addEventListener('change', (event) => {
        selectedFilename = event.target.value;
    });

    uploadButton.addEventListener('click', async () => {
        const file = uploadInput.files[0];
        if (!file) {
            uploadStatus.textContent = "Please select a PDF file.";
            uploadStatus.className = "status-message error";
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        uploadStatus.textContent = "Uploading file...";
        uploadStatus.className = "status-message";

        try {
            // MODIFIED: Use API_BASE_URL for the fetch call
            const response = await fetch(`${API_BASE_URL}/upload/`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                uploadStatus.textContent = `File "${result.filename}" uploaded successfully!`;
                uploadStatus.className = "status-message success";
                // Add the new file to local storage and update dropdown
                let uploadedFiles = JSON.parse(localStorage.getItem('uploadedFiles')) || [];
                if (!uploadedFiles.includes(result.filename)) {
                    uploadedFiles.push(result.filename);
                    localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
                }
                await fetchUploadedFiles(); // Re-populate dropdown to include the new file
                uploadedFilenameSelect.value = result.filename; // Select the newly uploaded file
                selectedFilename = result.filename;

            } else {
                uploadStatus.textContent = `Error: ${result.detail || 'Upload failed'}`;
                uploadStatus.className = "status-message error";
            }
        } catch (error) {
            uploadStatus.textContent = `Network error: ${error.message}`;
            uploadStatus.className = "status-message error";
            console.error('Upload error:', error);
        }
    });

    summarizeButton.addEventListener('click', async () => {
        if (!selectedFilename) {
            summaryResult.classList.add('hidden');
            alert("Please select an uploaded PDF file first.");
            return;
        }

        summaryContent.innerHTML = 'Generating summary...';
        summaryResult.classList.remove('hidden');
        summarizeButton.disabled = true;

        try {
            // MODIFIED: Use API_BASE_URL for the fetch call
            const response = await fetch(`${API_BASE_URL}/generate/summary/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ filename: selectedFilename })
            });

            const result = await response.json();

            if (response.ok) {
                summaryContent.textContent = result.summary;
            } else {
                summaryContent.textContent = `Error: ${result.detail || 'Summary generation failed'}`;
                summaryResult.classList.add('error-message');
            }
        } catch (error) {
            summaryContent.textContent = `Network error: ${error.message}`;
            summaryResult.classList.add('error-message');
            console.error('Summary generation error:', error);
        } finally {
            summarizeButton.disabled = false;
        }
    });

    generateQuizButton.addEventListener('click', async () => {
        if (!selectedFilename) {
            quizGenerationStatus.textContent = "Please select an uploaded PDF file first.";
            quizGenerationStatus.className = "status-message error";
            return;
        }

        const num = parseInt(numQuestionsInput.value, 10);
        if (isNaN(num) || num <= 0) {
            quizGenerationStatus.textContent = "Please enter a valid number of questions (greater than 0).";
            quizGenerationStatus.className = "status-message error";
            return;
        }

        quizGenerationStatus.textContent = "Generating quiz questions...";
        quizGenerationStatus.className = "status-message";
        generateQuizButton.disabled = true;
        quizSection.classList.add('hidden'); // Hide quiz section during generation
        quizAnalysisSection.classList.add('hidden'); // Hide analysis section

        try {
            // MODIFIED: Use API_BASE_URL for the fetch call
            const response = await fetch(`${API_BASE_URL}/generate/quiz/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ filename: selectedFilename, num: num })
            });

            const result = await response.json();

            if (response.ok) {
                currentQuizData = result.questions;
                if (currentQuizData && currentQuizData.length > 0) {
                    quizGenerationStatus.textContent = "Quiz generated successfully!";
                    quizGenerationStatus.className = "status-message success";
                    displayQuiz();
                    quizSection.classList.remove('hidden');
                    submitQuizButton.classList.remove('hidden');
                    startNewQuizButton.classList.add('hidden'); // Hide "Start New Quiz" initially
                } else {
                    quizGenerationStatus.textContent = "No questions generated. The model might not have found enough content.";
                    quizGenerationStatus.className = "status-message error";
                }
            } else {
                quizGenerationStatus.textContent = `Error: ${result.detail || 'Quiz generation failed'}`;
                quizGenerationStatus.className = "status-message error";
                currentQuizData = []; // Clear quiz data on error
            }
        } catch (error) {
            quizGenerationStatus.textContent = `Network error: ${error.message}`;
            quizGenerationStatus.className = "status-message error";
            console.error('Quiz generation error:', error);
            currentQuizData = []; // Clear quiz data on error
        } finally {
            generateQuizButton.disabled = false;
        }
    });

    function displayQuiz() {
        quizContainer.innerHTML = ''; // Clear previous quiz
        currentQuizData.forEach((q, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.classList.add('quiz-question');
            // Ensure q.Options is an array and has at least 4 elements before accessing them
            const option0 = q.Options && q.Options[0] !== undefined ? q.Options[0] : 'N/A';
            const option1 = q.Options && q.Options[1] !== undefined ? q.Options[1] : 'N/A';
            const option2 = q.Options && q.Options[2] !== undefined ? q.Options[2] : 'N/A';
            const option3 = q.Options && q.Options[3] !== undefined ? q.Options[3] : 'N/A';

            questionDiv.innerHTML = `
                <p>Q${index + 1}: ${q.Question}</p>
                <div class="quiz-options">
                    <label>
                        <input type="radio" name="question${index}" value="${option0}"> ${option0}
                    </label>
                    <label>
                        <input type="radio" name="question${index}" value="${option1}"> ${option1}
                    </label>
                    <label>
                        <input type="radio" name="question${index}" value="${option2}"> ${option2}
                    </label>
                    <label>
                        <input type="radio" name="question${index}" value="${option3}"> ${option3}
                    </label>
                </div>
            `;
            quizContainer.appendChild(questionDiv);
        });
    }

    submitQuizButton.addEventListener('click', () => {
        let score = 0;
        const userAnswers = [];
        correctList.innerHTML = '';
        incorrectList.innerHTML = '';

        currentQuizData.forEach((q, index) => {
            const selectedOption = document.querySelector(`input[name="question${index}"]:checked`);
            const userAnswer = selectedOption ? selectedOption.value : null;
            // Handle cases where q.Answer might be missing or null
            const correctAnswer = q.Answer !== undefined && q.Answer !== null ? String(q.Answer) : 'N/A';
            const isCorrect = userAnswer === correctAnswer;

            userAnswers.push({
                question: q.Question,
                userAnswer: userAnswer,
                correctAnswer: correctAnswer,
                isCorrect: isCorrect,
                description: q.Description || 'No description provided.' // Provide a default if missing
            });

            if (isCorrect) {
                score++;
            }
        });

        displayQuizAnalysis(score, userAnswers);
        quizSection.classList.add('hidden');
        quizAnalysisSection.classList.remove('hidden');
        submitQuizButton.classList.add('hidden');
        startNewQuizButton.classList.remove('hidden'); // Show "Start New Quiz" button
    });

    function displayQuizAnalysis(score, userAnswers) {
        scoreDisplay.textContent = `${score} / ${currentQuizData.length}`;

        userAnswers.forEach((answer, index) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<strong>Q${index + 1}:</strong> ${answer.question}<br>
                                  <strong>Your Answer:</strong> ${answer.userAnswer || 'Not answered'}<br>
                                  <strong>Correct Answer:</strong> ${answer.correctAnswer}<br>
                                  <strong>Description:</strong> ${answer.description}`;

            if (answer.isCorrect) {
                listItem.style.color = '#28a745'; // Green
                correctList.appendChild(listItem);
            } else {
                listItem.style.color = '#dc3545'; // Red
                incorrectList.appendChild(listItem);
            }
        });
    }

    startNewQuizButton.addEventListener('click', () => {
        // Reset the UI to allow generating a new quiz
        quizAnalysisSection.classList.add('hidden');
        quizSection.classList.add('hidden');
        quizContainer.innerHTML = ''; // Clear previous quiz display
        quizGenerationStatus.textContent = ''; // Clear status message
        submitQuizButton.classList.add('hidden');
        startNewQuizButton.classList.add('hidden'); // Hide itself
        numQuestionsInput.value = 5; // Reset number of questions input
        // Re-enable generate quiz button if needed
        generateQuizButton.disabled = false;
        // Also clear previous analysis results
        correctList.innerHTML = '';
        incorrectList.innerHTML = '';
        scoreDisplay.textContent = '';
    });

    // Smooth scrolling for navigation
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
