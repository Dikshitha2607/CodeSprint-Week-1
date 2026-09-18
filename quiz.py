"""Offline-retrieval RAG quiz generator used by the Air GamePad API.

The retrieval step uses only the Python standard library, so uploads never
download a Hugging Face model or require a Hugging Face token at runtime.
"""
import argparse
import json
import math
import os
import re
from collections import Counter
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

MAX_TEXT_CHARS = 70_000
SUPPORTED_SUFFIXES = {'.pdf', '.docx', '.txt', '.md', '.csv', '.json'}
STOP_WORDS = {'about', 'after', 'also', 'and', 'are', 'been', 'being', 'but', 'can', 'each', 'for', 'from', 'have', 'into', 'its', 'more', 'not', 'only', 'other', 'our', 'that', 'the', 'their', 'this', 'these', 'they', 'was', 'were', 'what', 'when', 'where', 'which', 'with', 'would', 'your'}


def load_local_env():
    """Load this project's untracked .env without replacing deployment vars."""
    env_path = Path(__file__).with_name('.env')
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key, value = line.split('=', 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def extract_text(file_path):
    path = Path(file_path)
    suffix = path.suffix.lower()
    if suffix not in SUPPORTED_SUFFIXES:
        raise ValueError('Unsupported file type. Upload PDF, DOCX, TXT, MD, CSV, or JSON.')
    if suffix == '.pdf':
        from pypdf import PdfReader
        try:
            return '\n'.join(page.extract_text() or '' for page in PdfReader(path).pages)
        except Exception as error:
            raise ValueError('This PDF could not be read. Use a text-based PDF (not a scanned image) or export it as TXT.') from error
    if suffix == '.docx':
        from docx import Document
        return '\n'.join(paragraph.text for paragraph in Document(path).paragraphs)
    return path.read_text(encoding='utf-8', errors='ignore')


def chunk_text(text, size=1100, overlap=160):
    chunks, start = [], 0
    while start < len(text):
        end = min(len(text), start + size)
        if end < len(text):
            boundary = max(text.rfind('\n', start + size // 2, end), text.rfind(' ', start + size // 2, end))
            if boundary > start:
                end = boundary
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(text):
            break
        start = max(end - overlap, start + 1)
    return chunks


def tokens(text):
    return [word for word in re.findall(r"[a-zA-Z][a-zA-Z0-9'-]{2,}", text.lower()) if word not in STOP_WORDS]


def retrieve_context(chunks, limit=6):
    """Local TF-IDF retrieval with diversity; no remote embedding model needed."""
    document_frequency, chunk_tokens = Counter(), []
    for chunk in chunks:
        terms = tokens(chunk)
        chunk_tokens.append(terms)
        document_frequency.update(set(terms))
    total_chunks = max(1, len(chunks))
    scores = []
    for index, terms in enumerate(chunk_tokens):
        counts = Counter(terms)
        score = sum((1 + math.log(count)) * math.log((total_chunks + 1) / (document_frequency[word] + 1) + 1)
                    for word, count in counts.items()) / max(1, len(terms))
        scores.append((score, index))
    selected = []
    for _, index in sorted(scores, reverse=True):
        if all(abs(index - prior) > 1 for prior in selected):
            selected.append(index)
        if len(selected) == min(limit, len(chunks)):
            break
    if not selected:
        selected = list(range(min(limit, len(chunks))))
    return '\n\n---\n\n'.join(chunks[index] for index in sorted(selected))


def validate_quiz(quiz):
    questions = quiz.get('questions') if isinstance(quiz, dict) else None
    if not isinstance(questions, list) or len(questions) != 5:
        raise ValueError('Groq returned an invalid quiz: exactly five questions are required.')
    cleaned = []
    for question in questions:
        options = question.get('options') if isinstance(question, dict) else None
        answer = question.get('answer') if isinstance(question, dict) else None
        if (not isinstance(question.get('question'), str) or not isinstance(options, list)
                or len(options) != 4 or not isinstance(answer, int) or answer not in range(4)):
            raise ValueError('Groq returned an invalid quiz question. Please try the upload again.')
        cleaned.append({'question': question['question'].strip(), 'options': [str(option).strip() for option in options], 'answer': answer, 'explanation': str(question.get('explanation', '')).strip()})
    return {'questions': cleaned}


def generate(file_path):
    text = extract_text(file_path).strip()
    if not text:
        raise ValueError('No readable text was found. Scanned PDFs need OCR or should be exported as a text-based PDF.')
    context = retrieve_context(chunk_text(text[:MAX_TEXT_CHARS]))
    api_key = os.environ.get('GROQ_API_KEY')
    if not api_key:
        raise ValueError('GROQ_API_KEY is not configured. Add it to the local .env file.')
    prompt = '''Create exactly 5 fair multiple-choice study questions using only the supplied document context. Return JSON only: {"questions":[{"question":"...","options":["...","...","...","..."],"answer":0,"explanation":"..."}]}. Each question needs exactly four distinct options. answer is the zero-based correct-option index. Never use facts outside the context.\n\nDocument context:\n''' + context
    payload = json.dumps({'model': os.environ.get('GROQ_MODEL', 'openai/gpt-oss-20b'), 'messages': [{'role': 'system', 'content': 'You create accurate grounded quizzes. Return valid JSON only.'}, {'role': 'user', 'content': prompt}], 'response_format': {'type': 'json_object'}, 'temperature': 0.2, 'max_tokens': 1800}).encode('utf-8')
    # Groq's Cloudflare edge rejects Python's default "Python-urllib/..."
    # signature with error 1010. Identify this application explicitly.
    request = Request('https://api.groq.com/openai/v1/chat/completions', data=payload, headers={
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
        'User-Agent': 'AirGamePad-RAG/1.0',
    }, method='POST')
    try:
        with urlopen(request, timeout=90) as response:
            result = json.loads(response.read().decode('utf-8'))
    except HTTPError as error:
        details = error.read().decode('utf-8', errors='replace')[:500]
        raise ValueError(f'Groq request failed ({error.code}): {details}') from error
    except URLError as error:
        raise ValueError(f'Could not reach the Groq API: {error.reason}') from error
    content = result.get('choices', [{}])[0].get('message', {}).get('content')
    if not content:
        raise ValueError('Groq returned an empty quiz response.')
    try:
        return validate_quiz(json.loads(content))
    except json.JSONDecodeError as error:
        raise ValueError('Groq returned invalid JSON. Please upload again.') from error


if __name__ == '__main__':
    load_local_env()
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True)
    try:
        print(json.dumps(generate(parser.parse_args().input)))
    except Exception as error:
        print(json.dumps({'error': str(error)}))
        raise SystemExit(1)
