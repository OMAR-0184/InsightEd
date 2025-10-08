# InsightEd 📚✨


Frontend:  https://insight-ed-pink.vercel.app

FastAPI docs :  https://insighted.onrender.com/docs

Android App Repo: https://github.com/OMAR-0184/InsightEd-app




## Table of Contents

-   [About The Project](#about-the-project)
-   [Features](#features)
-   [Tech Stack](#tech-stack)
-   [Prerequisites](#prerequisites)
-   [Installation](#installation)
    -   [Backend (FastAPI & Docker)](#backend-fastapi--docker)
    -   [Frontend (Static HTML/CSS/JS)](#frontend-static-htmlcssjs)
-   [Usage](#usage)
-   [Project Structure](#project-structure)
-   [Configuration](#configuration)
-   [Troubleshooting](#troubleshooting)
-   [Contributing](#contributing)
-   [License](#license)
-   [Contact](#contact)
-   [Acknowledgments](#acknowledgments)

---

## About The Project

InsightEd is an innovative educational application designed to transform how users interact with PDF documents. By leveraging advanced Large Language Models (LLMs) through the Google Gemini API, this tool enables users to upload PDF files and then intelligently generate concise summaries or engaging, interactive quizzes directly from the document's content.

The project is structured into two core components: a high-performance FastAPI backend responsible for handling AI processing, file management, and API endpoints, and a lightweight, responsive static HTML/CSS/JavaScript frontend for an intuitive user experience. The entire application is orchestrated using Docker, ensuring a consistent and straightforward setup process across various development and deployment environments.

##UI
<img width="1440" height="843" alt="Screenshot 2025-07-16 at 12 35 11 AM" src="https://github.com/user-attachments/assets/f9f0878a-8df1-4004-9faa-5e45432d5c42" />




<img width="1440" height="571" alt="Screenshot 2025-07-16 at 12 35 39 AM" src="https://github.com/user-attachments/assets/1e69ee6d-74a4-4ce6-89f3-63c20734b8d3" />



<img width="1438" height="846" alt="Screenshot 2025-07-16 at 12 37 26 AM" src="https://github.com/user-attachments/assets/18a09a92-777b-480b-86fb-403bf407deea" />






### Key Features:

* **PDF Document Upload:** Securely upload various PDF documents to the backend for processing.
* **Intelligent Summarization:** Obtain comprehensive and coherent summaries of uploaded PDFs, distilled by cutting-edge AI.
* **Dynamic Quiz Generation:** Create customisable multiple-choice quizzes with a user-defined number of questions.
* **Dockerized Environment:** Simplifies setup and guarantees consistent application behaviour.
* **High-Performance Backend:** FastAPI provides a robust, asynchronous API layer for efficient processing.
* **User-Friendly Interface:** A clean and interactive web interface built with standard web technologies.

---

## Features

* **Document Processing:** Upload PDF files and extract their textual content.
* **AI-Powered Summaries:** Generate concise and accurate summaries using the Google Gemini Pro model.
* **Customizable Quizzes:** Create multiple-choice quizzes with a user-defined number of questions.
* **Secure File Handling:** PDFs are stored locally within a designated directory managed by Docker volumes for persistence.
* **Cross-Origin Resource Sharing (CORS) Configuration:** Robust middleware setup for secure communication between frontend and backend during development.

---

## Tech Stack

### Backend:
* **Python 3.9+**
* **FastAPI:** Modern, fast (high-performance) web framework for building APIs.
* **Uvicorn:** ASGI server, powering the FastAPI application.
* **LangChain:** Framework for developing applications with LLMs, enabling complex prompt engineering and data interaction.
* **`langchain-google-genai`:** Specific integration for leveraging Google's Gemini 2.5 flash model within LangChain.
* **`PyPDFLoader`:** Utilized for efficient loading and parsing of PDF documents.
* **`python-dotenv`:** For secure management and loading of environment variables (e.g., API keys).

### Frontend:
* **HTML5:** Provides the structural foundation of the user interface.
* **CSS3:** Handles the aesthetic styling and layout for a visually appealing design.
* **JavaScript (Vanilla JS):** Implements dynamic interactivity and manages asynchronous communication with the backend API.

### Containerization:
* **Docker:** Facilitates packaging the backend application into isolated containers, ensuring consistent environments and simplifying deployment.

---

## Prerequisites

Before setting up the project, ensure the following software is installed on your system:

* **Docker Desktop:** (Includes Docker Engine, Docker CLI, and Docker Compose)
    * [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
* **Python 3.9+:** (Primarily used for local development/scripts, but the backend environment is containerized)
    * [Download Python](https://www.python.org/downloads/)
* **A Google API Key:** Essential for accessing the Google Gemini Pro model, which powers the summarization and quiz generation features.
    * [Obtain your Google API Key](https://ai.google.dev/gemini-api/docs/api-key)

---

## Installation

Follow these steps to get InsightEd up and running on your local machine.

### Backend (FastAPI & Docker)

1.  **Clone the Repository:**
    Start by cloning the project repository to your local machine:
    ```bash
    git clone [https://github.com/](https://github.com/)[YourGitHubUsername]/InsightEd.git
    cd InsightEd/InsightEd_local # Navigate to your backend directory
    ```
    *(Note: This assumes your backend code resides in a subdirectory named `InsightEd_local` within the cloned repository.)*

2.  **Verify `requirements.txt`:**
    Confirm that a `requirements.txt` file exists in your `InsightEd_local` directory, listing all necessary Python dependencies (e.g., `fastapi`, `uvicorn`, `langchain-community`, etc.).

3.  **Place Static Frontend Files:**
    Ensure that your static frontend assets (e.g., `index.html`, `script.js`, `style.css`, images) are correctly placed within the `static/` directory inside your `InsightEd_local` folder. This is where FastAPI will serve them from.
    ```
    InsightEd_local/
    ├── backend.py
    ├── model.py
    ├── requirements.txt
    ├── Dockerfile
    ├── .env                     # (Optional, for local Python runs)
    ├── uploaded_pdfs/           # (Managed by Docker volume)
    └── static/                  # Your static UI files
        ├── index.html
        ├── script.js
        └── style.css
        └── ...
    ```

4.  **Build the Docker Image:**
    From inside the `InsightEd_local` directory (where your `Dockerfile` is located), build the Docker image for your backend:
    ```bash
    docker build -t insighted-backend .
    ```

5.  **Set Up Persistent Storage (Docker Volume - Highly Recommended):**
    To ensure your uploaded PDF files persist even if the Docker container is stopped or removed, create a directory on your host machine to serve as a Docker volume:
    ```bash
    mkdir -p ./my_uploaded_pdfs_data
    ```
    Then, run the Docker container, mounting this host directory to the `uploaded_pdfs` directory inside the container:
    ```bash
    docker run -d -p 8000:8000 \
               --name insighted-app \
               -e GOOGLE_API_KEY="YOUR_ACTUAL_GOOGLE_API_KEY_HERE" \
               -v "$(pwd)/my_uploaded_pdfs_data:/app/uploaded_pdfs" \
               insighted-backend
    ```
    *(**Important:** Replace `YOUR_ACTUAL_GOOGLE_API_KEY_HERE` with your valid Google API Key.)*

    *After running this command, confirm your backend container is active by checking `docker ps`. You should see `insighted-app` listed with a `STATUS` of `Up ...`.*

### Frontend (Static HTML/CSS/JS)

Your static HTML, CSS, and JavaScript files are served directly by the FastAPI backend you just started.

1.  **Configure API Base URL in JavaScript:**
    Open your primary JavaScript file (e.g., `script.js`) and ensure that all API calls are directed to the correct backend address.
    ```javascript
    // In your script.js file (or similar)
    const API_BASE_URL = '[http://127.0.0.1:8000](http://127.0.0.1:8000)'; // Standard local access
    // If you plan to access the backend from a different machine on your local network,
    // replace '127.0.0.1' with the actual network IP address of the machine
    // running your Docker backend (e.g., '[http://192.168.1.100:8000](http://192.168.1.100:8000)').
    ```

2.  **Access the Application:**
    Once your Dockerized backend is running successfully (as confirmed in the previous steps), open your web browser and navigate to:
    ```
    http://localhost:8000/static/index.html
    ```
    This URL will serve your static UI, which will then interact with the backend API.

    *If you are using a separate local development server (like VS Code's Live Server) to serve your `static` files (e.g., at `http://127.0.0.1:5500`), ensure that this specific URL is explicitly included in your `backend.py`'s CORS `origins` list.*

---

## Usage

With both the backend and frontend components running:

1.  **Open your frontend** in a web browser using the URL `http://localhost:8000/static/index.html` (or your local dev server URL if applicable).
2.  **Upload a PDF file** using the dedicated upload interface. A confirmation message should appear upon successful upload.
3.  After a PDF is uploaded, you can choose to:
    * Initiate **"Generate Summary"** to receive a concise overview of the document's content.
    * Input the desired number of questions and click **"Generate Quiz"** to create an interactive quiz derived from the PDF.

---
