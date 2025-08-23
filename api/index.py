# Wrapper to expose the Flask app for Vercel
import sys
sys.path.append('..')  # Ensure parent dir is in path
from app import app  # Expose as 'app' for Vercel Python runtime
