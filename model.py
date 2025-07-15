import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.messages import AIMessage
from langchain.chains.summarize import load_summarize_chain
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings 


load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY not found in environment variables. Please set it in a .env file.")


llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7, google_api_key=GOOGLE_API_KEY)
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=GOOGLE_API_KEY)


def get_document_chunks(docs):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=4000, chunk_overlap=200)
    chunks = text_splitter.split_documents(docs)
    return chunks

def get_vector_store(chunks):
    vector_store = FAISS.from_documents(chunks, embeddings)
    return vector_store


def summarize(loader):
    docs = loader.load()
    chunks = get_document_chunks(docs) 

    map_prompt_template = """
    You are an expert summarizer. Summarize the following section of a larger document concisely.
    Focus on key ideas and important details from this specific section.
    Do not include any introductory or concluding remarks.

    Content section:
    {text}
    """
    map_prompt = PromptTemplate(template=map_prompt_template, input_variables=["text"])

    combine_prompt_template = """
    You are an expert tutor and summarizer. You have been provided with several individual summaries of a large document.
    Your task is to combine these into a single, comprehensive, and highly effective summary designed for quick revision and learning.

    Focus on extracting the most important concepts, definitions, key arguments, and facts from ALL the provided summaries.
    Present the final summary using clear, concise bullet points or a numbered list for easy readability.
    If applicable, briefly explain complex terms or concepts.
    Keep sentences short and to the point.
    Do NOT include any introductory or concluding remarks (e.g., "Here is a summary..."). Just provide the summary content directly.

    Example of desired format:
    - **Main Topic 1**: Key point A. Sub-point 1.
      - Important detail.
    - **Concept X**: Definition. Example/Application.
    - **Process Y**:
      1. Step 1 description.
      2. Step 2 description.
    - **Key Fact Z**: Relevant detail.

    Individual summaries to combine:
    {text}
    """
    combine_prompt = PromptTemplate(template=combine_prompt_template, input_variables=["text"])

    try:
        summary_chain = load_summarize_chain(
            llm,
            chain_type="map_reduce",
            map_prompt=map_prompt,
            combine_prompt=combine_prompt,
            verbose=False
        )
        
        summary_result = summary_chain.invoke({"input_documents": chunks})
        final_summary = summary_result.get("output_text", "No summary generated.")

        return final_summary

    except Exception as e:
        print(f"Error during summarization: {e}")
        return "Failed to generate summary. Please check the document content or try again later. (Error details: " + str(e) + ")"


# --- Quiz Generation Function ---
def quiz(num_questions: int, loader):
    docs = loader.load()
    
    full_text = "\n\n".join([doc.page_content for doc in docs])

    quiz_parser = JsonOutputParser()

    quiz_prompt_template = """
    You are an expert at creating multiple-choice questions from text.
    Generate exactly {num_questions} multiple-choice questions from the following content.
    For each question, provide 4 distinct options, the correct answer, and a short explanation/description.
    Ensure the 'Options' field is always a JSON array of exactly 4 strings.
    Ensure 'Answer' is one of the provided options.
    Do NOT include any introductory or concluding remarks. Just provide the JSON.

    Format the output as a JSON array of objects, like this:
    [
      {{
        "Question": "What is ...?",
        "Options": ["Option A", "Option B", "Option C", "Option D"],
        "Answer": "Correct Option",
        "Description": "Explanation for the answer."
      }},
      {{
        "Question": "Another question ...?",
        "Options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "Answer": "Correct Option",
        "Description": "Explanation for this answer."
      }}
    ]

    Content:
    {text_content}
    """

    quiz_prompt = PromptTemplate(
        template=quiz_prompt_template,
        input_variables=["num_questions", "text_content"],
        partial_variables={"format_instructions": quiz_parser.get_format_instructions()},
    )

    try:
        quiz_chain = quiz_prompt | llm | quiz_parser
        generated_quiz = quiz_chain.invoke({
            "num_questions": num_questions,
            "text_content": full_text
        })

        if not isinstance(generated_quiz, list):
            print(f"Warning: Quiz output from LLM was not a list: {generated_quiz}")
            return []

        validated_questions = []
        for q in generated_quiz:
            if (isinstance(q, dict) and
                "Question" in q and
                "Options" in q and isinstance(q["Options"], list) and len(q["Options"]) == 4 and
                all(isinstance(opt, str) for opt in q["Options"]) and
                "Answer" in q and
                "Description" in q):
                validated_questions.append(q)
            else:
                print(f"Skipping malformed question: {q}")
        
        return validated_questions

    except Exception as e:
        print(f"Error during quiz generation: {e}")
        return []