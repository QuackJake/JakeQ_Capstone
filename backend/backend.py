import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Specify the directory where the documents are stored
DOCUMENT_DIR = "pdf_reader_src/legal_documents/fillable"

@app.route('/api/documents', methods=['GET'])
def get_documents():
    documents = []
    for filename in os.listdir(DOCUMENT_DIR):
        if filename.endswith(".pdf") or filename.endswith(".docx"):
            documents.append({
                "id": len(documents) + 1,
                "title": filename,
                "description": "A document of type " + filename.split('.')[-1].upper(),
                "file_path": f"/files/{filename}",  # Create path for frontend to access
            })
    return jsonify(documents)

@app.route('/files/<filename>')
def serve_file(filename):
    return send_from_directory(DOCUMENT_DIR, filename)

if __name__ == '__main__':
    app.run(debug=True)
