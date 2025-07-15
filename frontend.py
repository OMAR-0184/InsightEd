import streamlit as st
import requests
import tempfile
import random

API_URL = "http://localhost:8000"  # Update if deployed elsewhere

st.set_page_config(page_title="AI PDF Summary & Quiz", layout="centered")
st.title("📚 AI PDF Quiz & Summary")

uploaded_file = st.file_uploader("📤 Upload a PDF", type="pdf")

if uploaded_file:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(uploaded_file.read())
        tmp_path = tmp.name

    # Upload to FastAPI backend
    with open(tmp_path, "rb") as f:
        files = {"file": (uploaded_file.name, f, "application/pdf")}
        with st.spinner("📡 Uploading to server..."):
            res = requests.post(f"{API_URL}/upload/", files=files)

    if res.status_code == 200:
        st.success("✅ Uploaded successfully!")
        filename = res.json()["filename"]

        # Generate Summary
        with st.expander("📑 Generate Summary"):
            if st.button("📝 Generate Summary"):
                with st.spinner("Summarizing..."):
                    summary_res = requests.post(
                        f"{API_URL}/generate/summary/", params={"filename": filename}
                    )
                    if summary_res.status_code == 200:
                        summary = summary_res.json()["summary"]
                        st.markdown("### 📌 Summary")
                        for point in summary.split("\n"):
                            if point.strip():
                                st.write("•", point.strip())
                        st.download_button("⬇️ Download Summary", summary, file_name="summary.txt")
                    else:
                        st.error("❌ Failed to fetch summary.")

        # Generate Quiz
        with st.expander("🧠 Generate Quiz"):
            num_q = st.number_input("Number of questions:", min_value=1, max_value=20, value=5)
            if st.button("🎯 Generate Quiz"):
                with st.spinner("Creating quiz..."):
                    quiz_res = requests.post(
                        f"{API_URL}/generate/quiz/",
                        params={"filename": filename, "num": num_q}
                    )
                    if quiz_res.status_code == 200:
                        quiz_data = quiz_res.json()["questions"]
                        # Shuffle options for each question and store in session state
                        processed_quiz = []
                        for q in quiz_data:
                            options = q.get("options", [])
                            random.shuffle(options)
                            processed_quiz.append({
                                "question": q.get("question", ""),
                                "options": options,
                                "answer": q.get("answer", ""),
                                "description": q.get("description", "")
                            })
                        st.session_state.quiz = processed_quiz
                        st.session_state.responses = {}  # Clear previous responses
                    else:
                        st.error("❌ Failed to fetch quiz.")

else:
    st.info("📎 Please upload a PDF to begin.")

# ==========================
# ✅ Display Quiz
# ==========================
if "quiz" in st.session_state:
    st.markdown("### 🧠 Quiz Time!")
    score = 0

    for i, q in enumerate(st.session_state.quiz):
        st.subheader(f"Q{i+1}. {q['question']}")
        selected = st.radio(
            "Choose:",
            q["options"],
            key=f"q_{i}",
            index=None  # No default selection
        )

        if selected:
            if f"graded_{i}" not in st.session_state:
                st.session_state.responses[i] = selected
                if selected == q["answer"]:
                    st.success("✅ Correct")
                    score += 1
                else:
                    st.error(f"❌ Incorrect. Correct: {q['answer']}")
                st.caption(f"💡 {q['description']}")
                st.session_state[f"graded_{i}"] = True
            else:
                # Already graded — show consistent results
                previous = st.session_state.responses[i]
                if previous == q["answer"]:
                    st.success("✅ Correct")
                else:
                    st.error(f"❌ Incorrect. Correct: {q['answer']}")
                st.caption(f"💡 {q['description']}")

    # ✅ Final score
    total = len(st.session_state.quiz)
    st.markdown("---")
    st.markdown(f"### 🎯 Final Score: `{sum(1 for i in st.session_state.responses if st.session_state.responses[i] == st.session_state.quiz[i]['answer'])} / {total}`")
