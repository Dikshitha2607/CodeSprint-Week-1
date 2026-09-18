import faiss
import numpy as np
import json
from pathlib import Path
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
import os
from groq import Groq

PDF_PATH = Path(r"C:\Users\Dikshitha\codesprint\notes\dwdmsem5.pdf")

#Extracting text from PDF
def extract_text(pdf_path):
    reader = PdfReader(str(pdf_path))
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text

#Splitting text into chunks
def split_text(text):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )
    chunks = splitter.split_text(text)
    return chunks

#Converting chunks into embeddings
def create_embeddings(chunks):
    embeddings_model = HuggingFaceEmbeddings(
        model_name="BAAI/bge-small-en-v1.5"
    )
    embeddings = embeddings_model.embed_documents(chunks)
    return embeddings

#Creating a vector store using FAISS
def create_vector_store(embeddings, chunks):
    embedding_array = np.array(embeddings, dtype="float32")
    dimension = embedding_array.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embedding_array)
    faiss.write_index(index, "notes.index")
    with open("chunks.json", "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)
    return index

#Searching for relevant chunks based on a question
def search_chunks(question, index, chunks, k=3):
    embeddings_model = HuggingFaceEmbeddings(
        model_name="BAAI/bge-small-en-v1.5"
    )
    question_embedding = embeddings_model.embed_query(question)
    question_array = np.array([question_embedding], dtype="float32")

    distances, indices = index.search(question_array, k)
    results = []
    for i in indices[0]:
        if i != -1:
            results.append(chunks[i])
    return results

#Generating quiz question using Groq
def generate_quiz(retrieved_chunks):
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    context = "\n\n".join(retrieved_chunks)
    prompt = f"""
You are an AI quiz generator.
Generate exactly 5 different multiple-choice questions based ONLY on the provided context.

Context:
{context}

Requirements:
Generate exactly 5 questions. Each question must have 4 options: A, B, C, D.Each question must have only one correct answer. 
Questions must be different from each other. Do not repeat the same concept unnecessarily. Do not use information outside the provided context.
Keep the questions suitable for a student quiz.Return ONLY valid JSON in this format:
{{
  "questions": [
    {{
      "question": "Question text",
      "options": {{
        "A": "Option A",
        "B": "Option B",
        "C": "Option C",
        "D": "Option D"
      }},
      "answer": "A"
    }}
  ]
}}
"""
    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )
    return response.choices[0].message.content

if __name__ == "__main__":
    print("Reading PDF...")
    text = extract_text(PDF_PATH)
    print(f"Extracted {len(text)} characters.")
    print("\nSplitting text into chunks...")
    chunks = split_text(text)
    print(f"Created {len(chunks)} chunks.")
print("\nCreating embeddings...")
embeddings = create_embeddings(chunks)
print(f"Created {len(embeddings)} embeddings.")
print(f"Each embedding has {len(embeddings[0])} numbers.")

print("\nCreating vector store...")
index = create_vector_store(embeddings, chunks)
print(f"Stored {index.ntotal} embeddings in FAISS.")

print("\nSearching for relevant chunks...")
question = "Generate quiz questions from this study material."
results = search_chunks(question, index, chunks)
print("\nGenerating 5-question quiz with Groq...")
quiz = generate_quiz(results)
print("\n--- Generated Quiz ---")
print(quiz)
