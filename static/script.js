document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('bg-animation');
    const ctx = canvas.getContext('2d');
    let width, height, stars, meteors;

    const initCanvas = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        stars = [];
        meteors = [];
        for (let i = 0; i < 200; i++) {
            stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 1.5,
                opacity: Math.random()
            });
        }
    };

    const createMeteor = () => {
        meteors.push({
            x: Math.random() * width,
            y: Math.random() * (height / 2),
            len: Math.random() * 80 + 20,
            speed: Math.random() * 10 + 5,
            opacity: 1
        });
    };

    const animate = () => {
        ctx.clearRect(0, 0, width, height);
        stars.forEach(s => {
            ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
            s.opacity += (Math.random() - 0.5) * 0.05;
            if (s.opacity < 0) s.opacity = 0;
            if (s.opacity > 1) s.opacity = 1;
        });
        meteors.forEach((m, i) => {
            const gradient = ctx.createLinearGradient(m.x, m.y, m.x - m.len, m.y - m.len);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${m.opacity})`);
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(m.x, m.y);
            ctx.lineTo(m.x - m.len, m.y - m.len);
            ctx.stroke();
            m.x += m.speed;
            m.y += m.speed;
            m.opacity -= 0.01;
            if (m.opacity <= 0) meteors.splice(i, 1);
        });
        if (Math.random() < 0.02) createMeteor();
        requestAnimationFrame(animate);
    };

    window.addEventListener('resize', initCanvas);
    initCanvas();
    animate();

    const API_BASE_URL = 'https://insighted.onrender.com';
    const uploadInput = document.getElementById('pdfUpload');
    const uploadButton = document.getElementById('uploadButton');
    const uploadStatus = document.getElementById('uploadStatus');
    const uploadedFilenameSelect = document.getElementById('uploadedFilename');
    const summarizeButton = document.getElementById('summarizeButton');
    const summaryResult = document.getElementById('summaryResult');
    const summaryContent = document.getElementById('summaryContent');
    const saveSummaryBtn = document.getElementById('save-summary-btn');
    const numQuestionsInput = document.getElementById('numQuestions');
    const generateQuizButton = document.getElementById('generateQuizButton');
    const controls = document.getElementById('controls');
    const workspacePage = document.getElementById('workspace-page');
    const bookmarksPage = document.getElementById('bookmarks-page');
    const bookmarksList = document.getElementById('bookmarks-list');
    const savedSummariesList = document.getElementById('saved-summaries-list');
    const viewWorkspace = document.getElementById('view-workspace');
    const viewBookmarks = document.getElementById('view-bookmarks');
    const navLogo = document.getElementById('nav-logo');
    const quizModal = document.getElementById('quiz-modal');
    const quizModalTitle = document.getElementById('quiz-modal-title');
    const quizFileNameDisplay = document.getElementById('quiz-file-name');
    const quizContainer = document.getElementById('quiz-container');
    const prevQuestionBtn = document.getElementById('prev-question');
    const nextQuestionBtn = document.getElementById('next-question');
    const submitQuizBtn = document.getElementById('submit-quiz');
    const questionCounter = document.getElementById('question-counter');
    const closeQuizBtn = document.getElementById('close-quiz');
    const exitQuizBtn = document.getElementById('exit-quiz');
    const bookmarkBtn = document.getElementById('bookmark-question');
    const quizResults = document.getElementById('quiz-results');
    const scoreDisplay = document.getElementById('score');
    const timerElement = document.getElementById('timer');
    const timeTakenElement = document.getElementById('timeTaken');
    const quizAnalysisDetails = document.getElementById('quiz-analysis-details');

    let currentQuizData = [];
    let userAnswers = [];
    let currentQuestionIndex = 0;
    let quizTimer;
    let startTime;
    let resultsChart;
    let lastGeneratedSummary = "";

    const setBtnLoading = (btn, isLoading) => {
        const spinner = btn.querySelector('.spinner');
        const text = btn.querySelector('.btn-text');
        btn.disabled = isLoading;
        if (isLoading) {
            spinner.classList.remove('hidden');
            text.classList.add('opacity-0');
        } else {
            spinner.classList.add('hidden');
            text.classList.remove('opacity-0');
        }
    };

    const switchPage = (page) => {
        if (page === 'bookmarks') {
            workspacePage.classList.add('hidden');
            bookmarksPage.classList.remove('hidden');
            renderBookmarks();
            renderSavedSummaries();
        } else {
            bookmarksPage.classList.add('hidden');
            workspacePage.classList.remove('hidden');
        }
    };

    viewBookmarks.addEventListener('click', () => switchPage('bookmarks'));
    viewWorkspace.addEventListener('click', () => switchPage('workspace'));
    navLogo.addEventListener('click', () => switchPage('workspace'));

    const closeQuizModal = () => { quizModal.classList.add('hidden'); clearInterval(quizTimer); };

    uploadButton.addEventListener('click', () => uploadInput.click());
    uploadInput.addEventListener('change', (e) => { if (e.target.files[0]) handleFileUpload(e.target.files[0]); });

    async function handleFileUpload(file) {
        const formData = new FormData();
        formData.append('file', file);
        uploadStatus.textContent = "Processing...";
        try {
            const response = await fetch(`${API_BASE_URL}/upload/`, { method: 'POST', body: formData });
            const result = await response.json();
            if (response.ok) {
                uploadStatus.textContent = `Active: ${result.filename}`;
                let files = JSON.parse(localStorage.getItem('uploadedFiles')) || [];
                if (!files.includes(result.filename)) {
                    files.push(result.filename);
                    localStorage.setItem('uploadedFiles', JSON.stringify(files));
                }
                updateFileDropdown();
                uploadedFilenameSelect.value = result.filename;
                controls.classList.remove('hidden');
            }
        } catch (e) { uploadStatus.textContent = "Error"; }
    }

    function updateFileDropdown() {
        const files = JSON.parse(localStorage.getItem('uploadedFiles')) || [];
        uploadedFilenameSelect.innerHTML = files.map(f => `<option value="${f}">${f}</option>`).join('');
        if (files.length > 0) controls.classList.remove('hidden');
    }

    summarizeButton.addEventListener('click', async () => {
        const filename = uploadedFilenameSelect.value;
        setBtnLoading(summarizeButton, true);
        try {
            const response = await fetch(`${API_BASE_URL}/generate/summary/`, {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ filename })
            });
            const result = await response.json();
            if (response.ok) {
                lastGeneratedSummary = result.summary;
                summaryContent.innerHTML = result.summary.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>').replace(/\n/g, '<br>');
                summaryResult.classList.remove('hidden');
            }
        } finally { setBtnLoading(summarizeButton, false); }
    });

    saveSummaryBtn.addEventListener('click', () => {
        if (!lastGeneratedSummary) return;
        let summaries = JSON.parse(localStorage.getItem('savedSummaries')) || [];
        summaries.unshift({ file: uploadedFilenameSelect.value, content: lastGeneratedSummary, date: new Date().toLocaleDateString() });
        localStorage.setItem('savedSummaries', JSON.stringify(summaries));
        alert("Summary saved.");
    });

    generateQuizButton.addEventListener('click', async () => {
        const filename = uploadedFilenameSelect.value;
        const num = parseInt(numQuestionsInput.value, 10);
        setBtnLoading(generateQuizButton, true);
        try {
            const response = await fetch(`${API_BASE_URL}/generate/quiz/`, {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ filename, num })
            });
            const result = await response.json();
            if (response.ok && result.questions.length > 0) {
                currentQuizData = result.questions;
                userAnswers = new Array(currentQuizData.length).fill(null);
                quizFileNameDisplay.textContent = filename;
                startQuiz();
            }
        } finally { setBtnLoading(generateQuizButton, false); }
    });

    function startQuiz() {
        currentQuestionIndex = 0;
        quizModalTitle.textContent = "Intelligence Test";
        quizResults.classList.add('hidden');
        quizContainer.classList.remove('hidden');
        document.getElementById('quiz-navigation').classList.remove('hidden');
        quizModal.classList.remove('hidden');
        displayQuestion();
        startTime = new Date();
        startTimer(currentQuizData.length * 120);
    }
    
    function startTimer(duration) {
        let timer = duration;
        clearInterval(quizTimer);
        quizTimer = setInterval(() => {
            let m = Math.floor(timer/60), s = timer%60;
            timerElement.textContent = `${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
            if (--timer < 0) submitQuiz();
        }, 1000);
    }
    
    function submitQuiz() {
        clearInterval(quizTimer);
        const timeDiff = Math.round((new Date() - startTime) / 1000);
        timeTakenElement.textContent = `${Math.floor(timeDiff / 60)}m ${timeDiff % 60}s`;
        let score = userAnswers.reduce((acc, ans, i) => acc + (ans === currentQuizData[i].Answer ? 1 : 0), 0);
        scoreDisplay.textContent = `${score} / ${currentQuizData.length}`;
        quizModalTitle.textContent = "Analysis Ready";
        quizContainer.classList.add('hidden');
        document.getElementById('quiz-navigation').classList.add('hidden');
        quizResults.classList.remove('hidden');
        displayResultsChart(score, currentQuizData.length);
        renderAnalysis();
    }

    function renderAnalysis() {
        quizAnalysisDetails.innerHTML = currentQuizData.map((q, i) => {
            const isCorrect = userAnswers[i] === q.Answer;
            return `
                <div class="p-6 rounded-2xl border ${isCorrect ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}">
                    <p class="font-bold text-white mb-2">${i + 1}. ${q.Question}</p>
                    <div class="flex items-center space-x-2 text-sm mb-3">
                        <span class="text-gray-500">Selection:</span>
                        <span class="${isCorrect ? 'text-green-400' : 'text-red-400'} font-bold">${userAnswers[i] || 'None'}</span>
                    </div>
                    ${!isCorrect ? `<div class="text-sm text-green-400 font-bold mb-3">Correct Key: ${q.Answer}</div>` : ''}
                    <div class="pt-3 border-t border-white/5 text-xs text-gray-400 leading-relaxed italic">
                        <span class="text-white not-italic font-bold mr-1">Explanation:</span> ${q.Description}
                    </div>
                </div>`;
        }).join('');
    }

    function displayResultsChart(correct, total) {
        const ctx = document.getElementById('resultsChart').getContext('2d');
        if (resultsChart) resultsChart.destroy();
        resultsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Correct', 'Incorrect'],
                datasets: [{ data: [correct, total - correct], backgroundColor: ['#10b981', '#ef4444'], borderWidth: 0 }]
            },
            options: { cutout: '85%', plugins: { legend: { display: false } } }
        });
    }

    function displayQuestion() {
        const q = currentQuizData[currentQuestionIndex];
        quizContainer.innerHTML = `
            <h3 class="text-xl font-bold mb-8 text-white leading-snug">${q.Question}</h3>
            <div class="space-y-4">
                ${q.Options.map(opt => `
                    <label class="quiz-option ${userAnswers[currentQuestionIndex] === opt ? 'selected' : ''}">
                        <input type="radio" name="option" value="${opt}" class="hidden">
                        <span class="text-sm font-medium">${opt}</span>
                    </label>
                `).join('')}
            </div>`;
        questionCounter.textContent = `Challenge ${currentQuestionIndex + 1} of ${currentQuizData.length}`;
        prevQuestionBtn.classList.toggle('invisible', currentQuestionIndex === 0);
        nextQuestionBtn.classList.toggle('hidden', currentQuestionIndex === currentQuizData.length - 1);
        submitQuizBtn.classList.toggle('hidden', currentQuestionIndex !== currentQuizData.length - 1);
        updateBookmarkUI();
        document.querySelectorAll('.quiz-option').forEach(el => {
            el.addEventListener('click', () => {
                userAnswers[currentQuestionIndex] = el.querySelector('input').value;
                document.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
                el.classList.add('selected');
            });
        });
    }

    function toggleBookmark() {
        const currentQ = currentQuizData[currentQuestionIndex];
        let marks = JSON.parse(localStorage.getItem('bookmarks')) || [];
        const exists = marks.find(b => b.Question === currentQ.Question);
        if (exists) {
            marks = marks.filter(b => b.Question !== currentQ.Question);
        } else {
            marks.push({ ...currentQ, date: new Date().toLocaleDateString(), file: uploadedFilenameSelect.value });
        }
        localStorage.setItem('bookmarks', JSON.stringify(marks));
        updateBookmarkUI();
    }

    function updateBookmarkUI() {
        const currentQ = currentQuizData[currentQuestionIndex];
        const marks = JSON.parse(localStorage.getItem('bookmarks')) || [];
        const exists = marks.find(b => b.Question === currentQ.Question);
        bookmarkBtn.querySelector('svg').setAttribute('fill', exists ? 'currentColor' : 'none');
    }

    function renderBookmarks() {
        const marks = JSON.parse(localStorage.getItem('bookmarks')) || [];
        if (marks.length === 0) {
            bookmarksList.innerHTML = '<p class="text-gray-600 italic">No bookmarked challenges found.</p>';
            return;
        }
        bookmarksList.innerHTML = marks.map((b, i) => `
            <div class="expandable-card bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 transition-all">
                <div class="flex justify-between items-center cursor-pointer" onclick="this.parentElement.classList.toggle('active')">
                    <div class="flex-1">
                        <span class="text-[10px] font-black text-blue-500 uppercase tracking-widest">${b.file}</span>
                        <p class="text-white font-bold mt-1 line-clamp-1">${b.Question}</p>
                    </div>
                    <svg class="chevron h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
                <div class="expandable-content border-t border-white/5 mt-4">
                    <p class="text-white text-sm font-medium mb-4 leading-relaxed">${b.Question}</p>
                    <div class="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl mb-4">
                        <p class="text-blue-400 text-[10px] font-black uppercase mb-2 tracking-widest">Correct Solution</p>
                        <p class="text-white text-sm font-bold mb-3">${b.Answer}</p>
                        <div class="pt-3 border-t border-white/5 text-xs text-gray-400 leading-relaxed italic">
                            <span class="text-white not-italic font-bold mr-1">Explanation:</span> ${b.Description}
                        </div>
                    </div>
                    <button onclick="deleteBookmark('${b.Question.replace(/'/g, "\\'")}')" class="text-red-500 text-[10px] font-bold uppercase tracking-widest hover:underline">Remove Item</button>
                </div>
            </div>`).join('');
    }

    function renderSavedSummaries() {
        const summaries = JSON.parse(localStorage.getItem('savedSummaries')) || [];
        if (summaries.length === 0) {
            savedSummariesList.innerHTML = '<p class="text-gray-600 italic">No intelligence summaries cached.</p>';
            return;
        }
        savedSummariesList.innerHTML = summaries.map((s, i) => `
            <div class="expandable-card bg-[#0A0A0A] p-6 rounded-2xl border border-white/5 transition-all">
                <div class="flex justify-between items-center cursor-pointer" onclick="this.parentElement.classList.toggle('active')">
                    <div class="flex-1">
                        <span class="text-[10px] font-black text-cyan-500 uppercase tracking-widest">${s.file}</span>
                        <p class="text-white font-bold mt-1 line-clamp-1"> Summary — ${s.date}</p>
                    </div>
                    <svg class="chevron h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
                <div class="expandable-content border-t border-white/5 mt-4">
                    <div class="text-xs text-gray-400 leading-relaxed font-light">${s.content.replace(/\*\*/g, '').replace(/\n/g, '<br>')}</div>
                    <button onclick="deleteSummary(${i})" class="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-6 hover:underline">Purge Summary</button>
                </div>
            </div>`).join('');
    }

    window.deleteBookmark = (text) => {
        let marks = JSON.parse(localStorage.getItem('bookmarks')) || [];
        marks = marks.filter(b => b.Question !== text);
        localStorage.setItem('bookmarks', JSON.stringify(marks));
        renderBookmarks();
    };

    window.deleteSummary = (index) => {
        let summaries = JSON.parse(localStorage.getItem('savedSummaries')) || [];
        summaries.splice(index, 1);
        localStorage.setItem('savedSummaries', JSON.stringify(summaries));
        renderSavedSummaries();
    };

    bookmarkBtn.addEventListener('click', toggleBookmark);
    submitQuizBtn.addEventListener('click', submitQuiz);
    prevQuestionBtn.addEventListener('click', () => { if (currentQuestionIndex > 0) { currentQuestionIndex--; displayQuestion(); } });
    nextQuestionBtn.addEventListener('click', () => { if (currentQuestionIndex < currentQuizData.length - 1) { currentQuestionIndex++; displayQuestion(); } });
    closeQuizBtn.addEventListener('click', closeQuizModal);
    exitQuizBtn.addEventListener('click', closeQuizModal);
    updateFileDropdown();
});
