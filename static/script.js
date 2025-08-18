document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://insighted.onrender.com';


    const loadingOverlay = document.getElementById('loading-overlay');
    

    const loadingAnimation = lottie.loadAnimation({
        container: document.getElementById('loading'),
        renderer: 'svg',
        loop: true,
        autoplay: false,
        path: 'https://lottie.host/e09d1185-d667-4257-8f24-00cd6d2a5db0/T05HDpjup5.json' 
    });

    const uploadInput = document.getElementById('pdfUpload');
    const uploadButton = document.getElementById('uploadButton');
    const uploadStatus = document.getElementById('uploadStatus');
    const uploadedFilenameSelect = document.getElementById('uploadedFilename');
    const summarizeButton = document.getElementById('summarizeButton');
    const summaryResult = document.getElementById('summaryResult');
    const summaryContent = document.getElementById('summaryContent');
    const numQuestionsInput = document.getElementById('numQuestions');
    const generateQuizButton = document.getElementById('generateQuizButton');
    const controls = document.getElementById('controls');

    // Quiz Modal Elements
    const quizModal = document.getElementById('quiz-modal');
    const quizModalTitle = document.getElementById('quiz-modal-title');
    const quizContainer = document.getElementById('quiz-container');
    const prevQuestionBtn = document.getElementById('prev-question');
    const nextQuestionBtn = document.getElementById('next-question');
    const submitQuizBtn = document.getElementById('submit-quiz');
    const questionCounter = document.getElementById('question-counter');
    const closeQuizBtn = document.getElementById('close-quiz');
    const quizResults = document.getElementById('quiz-results');
    const scoreDisplay = document.getElementById('score');
    const timerElement = document.getElementById('timer');
    const timeTakenElement = document.getElementById('timeTaken');
    const quizAnalysisDetails = document.getElementById('quiz-analysis-details');

    // Quiz State
    let currentQuizData = [];
    let userAnswers = [];
    let currentQuestionIndex = 0;
    let quizTimer;
    let startTime;
    let resultsChart;

    uploadButton.addEventListener('click', () => uploadInput.click());
    
    uploadInput.addEventListener('change', async () => {
        const file = uploadInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        uploadStatus.textContent = "Uploading...";
        loadingOverlay.classList.remove('hidden');
        loadingAnimation.play();

        try {
            const response = await fetch(`${API_BASE_URL}/upload/`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (response.ok) {
                uploadStatus.textContent = `Successfully uploaded ${result.filename}`;
                let uploadedFiles = JSON.parse(localStorage.getItem('uploadedFiles')) || [];
                if (!uploadedFiles.includes(result.filename)) {
                    uploadedFiles.push(result.filename);
                    localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
                }
                updateFileDropdown();
                uploadedFilenameSelect.value = result.filename;
                controls.classList.remove('hidden');
            } else {
                uploadStatus.textContent = `Error: ${result.detail || 'Upload failed'}`;
            }
        } catch (error) {
            uploadStatus.textContent = `Network error: ${error.message}`;
        } finally {
            loadingOverlay.classList.add('hidden');
            loadingAnimation.stop();
        }
    });

    function updateFileDropdown() {
        const files = JSON.parse(localStorage.getItem('uploadedFiles')) || [];
        uploadedFilenameSelect.innerHTML = '';
        if (files.length > 0) {
            files.forEach(filename => {
                const option = document.createElement('option');
                option.value = filename;
                option.textContent = filename;
                uploadedFilenameSelect.appendChild(option);
            });
            controls.classList.remove('hidden');
        }
    }

    summarizeButton.addEventListener('click', async () => {
        const filename = uploadedFilenameSelect.value;
        if (!filename) return;

        summaryResult.classList.add('hidden'); 
        summaryContent.innerHTML = ''; 
        loadingOverlay.classList.remove('hidden');
        loadingAnimation.play();

        try {
            const response = await fetch(`${API_BASE_URL}/generate/summary/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename })
            });
            const result = await response.json();

            if (response.ok) {
                // First, replace markdown bold with <strong> tags
                const boldedText = result.summary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                // Then, replace newlines with <br> tags
                summaryContent.innerHTML = boldedText.replace(/\n/g, '<br>');
            } else {
                summaryContent.textContent = `Error: ${result.detail || 'Summary generation failed'}`;
            }
        } catch (error) {
            summaryContent.textContent = `Network error: ${error.message}`;
        } finally {
            loadingOverlay.classList.add('hidden');
            loadingAnimation.stop();
            summaryResult.classList.remove('hidden');
        }
    });

    generateQuizButton.addEventListener('click', async () => {
        const filename = uploadedFilenameSelect.value;
        const num = parseInt(numQuestionsInput.value, 10);
        if (!filename || isNaN(num) || num <= 0) return;

        loadingOverlay.classList.remove('hidden');
        loadingAnimation.play();

        try {
            const response = await fetch(`${API_BASE_URL}/generate/quiz/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename, num })
            });
            const result = await response.json();

            if (response.ok && result.questions && result.questions.length > 0) {
                currentQuizData = result.questions;
                userAnswers = new Array(currentQuizData.length).fill(null);
                startQuiz();
            } else {
                alert('Failed to generate quiz. Please try again.');
            }
        } catch (error) {
            alert(`Network error: ${error.message}`);
        } finally {
            loadingOverlay.classList.add('hidden');
            loadingAnimation.stop();
        }
    });

    function startQuiz() {
        currentQuestionIndex = 0;
        quizModalTitle.textContent = "Quiz Time!";
        timerElement.classList.remove('hidden');
        quizResults.classList.add('hidden');
        quizContainer.classList.remove('hidden');
        document.getElementById('quiz-navigation').classList.remove('hidden');
        quizModal.classList.remove('hidden');
        displayQuestion();
        
        const quizDuration = currentQuizData.length * 120;
        startTime = new Date();
        startTimer(quizDuration);
    }
    
    function startTimer(duration) {
        let timer = duration, minutes, seconds;
        clearInterval(quizTimer);

        quizTimer = setInterval(() => {
            minutes = parseInt(timer / 60, 10);
            seconds = parseInt(timer % 60, 10);

            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;

            timerElement.textContent = minutes + ":" + seconds;

            if (--timer < 0) {
                clearInterval(quizTimer);
                alert("Time's up!");
                submitQuiz();
            }
        }, 1000);
    }
    
    function submitQuiz() {
        clearInterval(quizTimer);
        const endTime = new Date();
        const timeDiffSeconds = Math.round((endTime - startTime) / 1000);
        const minutes = Math.floor(timeDiffSeconds / 60);
        const seconds = timeDiffSeconds % 60;
        timeTakenElement.textContent = `${minutes}m ${seconds}s`;

        let score = 0;
        userAnswers.forEach((answer, index) => {
            if (answer === currentQuizData[index].Answer) {
                score++;
            }
        });

        scoreDisplay.textContent = `${score} / ${currentQuizData.length}`;
        quizModalTitle.textContent = "Quiz Results";
        timerElement.classList.add('hidden');
        quizContainer.classList.add('hidden');
        document.getElementById('quiz-navigation').classList.add('hidden');
        quizResults.classList.remove('hidden');
        
        displayResultsChart(score, currentQuizData.length);
        displayAnswerAnalysis();
    }

    function displayAnswerAnalysis() {
        quizAnalysisDetails.innerHTML = '';
        let analysisHTML = '<h3 class="text-2xl font-bold mb-4 mt-6 text-white">Answer Breakdown</h3>';

        currentQuizData.forEach((question, index) => {
            const userAnswer = userAnswers[index] || "Not Answered";
            const isCorrect = userAnswer === question.Answer;
            
            analysisHTML += `
                <div class="p-4 mb-4 rounded-lg ${isCorrect ? 'bg-green-300' : 'bg-red-300'}">
                    <p class="font-bold text-black">${index + 1}. ${question.Question}</p>
                    <p class="text-gray-800">Your Answer: <span class="font-semibold ${isCorrect ? 'text-green-800' : 'text-red-800'}">${userAnswer}</span></p>
                    <p class="text-gray-800">Correct Answer: <span class="font-semibold text-green-800">${question.Answer}</span></p>
                    <p class="mt-2 text-sm text-gray-700"><em>${question.Description}</em></p>
                </div>
            `;
        });
        
        quizAnalysisDetails.innerHTML = analysisHTML;
    }
    
    function displayResultsChart(correct, total) {
        const incorrect = total - correct;
        const ctx = document.getElementById('resultsChart').getContext('2d');
        
        if (resultsChart) {
            resultsChart.destroy();
        }

        Chart.defaults.color = '#d1d5db'; 

        resultsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Correct', 'Incorrect'],
                datasets: [{
                    data: [correct, incorrect],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderColor: [
                        'rgba(16, 185, 129, 1)',
                        'rgba(239, 68, 68, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    animateScale: true,
                    animateRotate: true
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#d1d5db'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Quiz Performance',
                        color: '#ffffff'
                    }
                }
            }
        });
    }

    submitQuizBtn.addEventListener('click', submitQuiz);

    closeQuizBtn.addEventListener('click', () => {
        quizModal.classList.add('hidden');
        clearInterval(quizTimer);
    });

    function displayQuestion() {
        const question = currentQuizData[currentQuestionIndex];
        quizContainer.innerHTML = `
            <h3 class="text-xl font-semibold mb-4 text-white">${question.Question}</h3>
            <div>
                ${question.Options.map(option => `
                    <label class="quiz-option ${userAnswers[currentQuestionIndex] === option ? 'selected' : ''}">
                        <input type="radio" name="option" value="${option}" class="hidden">
                        <span>${option}</span>
                    </label>
                `).join('')}
            </div>
        `;
        updateQuizNavigation();

        document.querySelectorAll('.quiz-option').forEach(el => {
            el.addEventListener('click', () => {
                userAnswers[currentQuestionIndex] = el.querySelector('input').value;
                document.querySelectorAll('.quiz-option').forEach(opt => opt.classList.remove('selected'));
                el.classList.add('selected');
            });
        });
    }

    function updateQuizNavigation() {
        questionCounter.textContent = `${currentQuestionIndex + 1} / ${currentQuizData.length}`;
        prevQuestionBtn.classList.toggle('hidden', currentQuestionIndex === 0);
        nextQuestionBtn.classList.toggle('hidden', currentQuestionIndex === currentQuizData.length - 1);
        submitQuizBtn.classList.toggle('hidden', currentQuestionIndex !== currentQuizData.length - 1);
    }

    prevQuestionBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayQuestion();
        }
    });

    nextQuestionBtn.addEventListener('click', () => {
        if (currentQuestionIndex < currentQuizData.length - 1) {
            currentQuestionIndex++;
            displayQuestion();
        }
    });
    
    updateFileDropdown();
});