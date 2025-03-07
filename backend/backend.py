import os, io, json, datetime, jwt
from flask import Flask, request, jsonify, send_from_directory, render_template, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

app = Flask(__name__)
CORS(app)

DOCUMENT_DIR = 'C:/Capstone/Capstone_2025/backend/dumps/legal_documents/fillable'
ALLOWED_EXTENSIONS = {'pdf', 'docx'}

app.config['DOCUMENT_DIR'] = DOCUMENT_DIR
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  

temporary_files = {}
documents = []

def load_documents():
    """Loads all files from DOCUMENT_DIR into memory at startup."""
    global documents
    documents = [
        {
            "id": i + 1,
            "title": filename,
            "description": f"A document of type {filename.split('.')[-1].upper()}",
            "file_path": f"/files/{filename}",
        }
        for i, filename in enumerate(os.listdir(DOCUMENT_DIR))
        if filename.endswith((".pdf", ".docx"))
    ]

load_documents()

@app.route('/')
def index():
    """Render an HTML page displaying available files."""
    return render_template('index.html', files=documents)

@app.route('/api/documents', methods=['GET'])
def get_documents():
    """Returns the preloaded list of documents as JSON."""
    return jsonify(documents)

@app.route('/files/<filename>')
def serve_file(filename):
    """Serves a file from the DOCUMENT_DIR."""
    return send_from_directory(DOCUMENT_DIR, filename)

@app.route('/download/<filename>')
def download_file(filename):
    """Allows users to download a file."""
    return send_from_directory(DOCUMENT_DIR, filename, as_attachment=True)

def allowed_file(filename):
    """Check if the file has a valid extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
def upload_file():
    """Uploads a file and temporarily stores it in memory."""
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type"}), 400

    filename = secure_filename(file.filename)
    
    # Store file in memory
    temporary_files[filename] = io.BytesIO(file.read())

    return jsonify({"message": "File uploaded successfully", "filename": filename})

@app.route('/retrieve/<filename>', methods=['GET'])
def retrieve_file(filename):
    """Retrieves a temporarily stored file."""
    if filename not in temporary_files:
        return jsonify({"error": "File not found"}), 404

    temp_file = temporary_files[filename]
    temp_file.seek(0)

    return send_file(temp_file, as_attachment=True, download_name=filename, mimetype="application/octet-stream")

@app.route('/process/<filename>', methods=['POST'])
def process_file(filename):
    """Processes a file (Placeholder for actual processing logic)."""
    if filename not in temporary_files:
        return jsonify({"error": "File not found"}), 404

    temp_file = temporary_files[filename]
    
    # Placeholder: Replace this with actual processing function
    processed_file = process_document(temp_file)  # Replace with actual function
    
    # Store processed file back in memory
    processed_output = io.BytesIO()
    processed_file.save(processed_output)
    processed_output.seek(0)
    
    return send_file(processed_output, as_attachment=True, download_name=f'processed_{filename}', mimetype="application/octet-stream")

@app.route('/clear_temp', methods=['POST'])
def clear_temp_files():
    """Clears all temporary files from memory."""
    temporary_files.clear()
    return jsonify({"message": "Temporary files cleared."})


if __name__ == '__main__':
    app.run(debug=True)
    