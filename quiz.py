from pathlib import Path
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings


PDF_PATH = Path(r"C:\Users\Dikshitha\codesprint\notes\dwdmsem5.pdf")


# 1. Extract text from PDF
def extract_text(pdf_path):
    reader = PdfReader(str(pdf_path))

    text = ""

    for page in reader.pages:
        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

    return text


# 2. Split text into chunks
def split_text(text):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )

    chunks = splitter.split_text(text)

    return chunks


# 3. Convert chunks into embeddings
def create_embeddings(chunks):
    embeddings_model = HuggingFaceEmbeddings(
        model_name="BAAI/bge-small-en-v1.5"
    )

    embeddings = embeddings_model.embed_documents(chunks)

    return embeddings


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

    print("\nDone!")