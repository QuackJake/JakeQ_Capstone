import subprocess, os

# Run the Flask backend
subprocess.Popen(['python', 'pdf_reader_src/backend.py'])

# Run the Vite frontend
frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend')
subprocess.Popen(['npm', 'run', 'dev'], cwd=frontend_dir)

input("Press Enter to stop servers...")  # Keep the script running