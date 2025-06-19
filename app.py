import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai # Import the Gemini library
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
# IMPORTANT: In a production environment, restrict CORS to your frontend's domain.
# For development, '*' allows requests from any origin.
CORS(app) 

# --- Configure Google Gemini API ---
# Get your Gemini API key from environment variables
# CORRECTED: This line should retrieve the key from the environment variable named "GEMINI_API_KEY"
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Choose your Gemini model (e.g., 'gemini-pro')
GEMINI_MODEL = "gemini-2.5-flash-preview-05-20" 

@app.route('/generate-content', methods=['POST'])
def generate_content():
    """
    Handles POST requests to generate educational content using Google Gemini API.
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()

    # Extract parameters from the request
    content_type = data.get('contentType', 'educational content')
    subject_area = data.get('subjectArea', 'general education')
    grade_level = data.get('gradeLevel', 'all levels')
    topic = data.get('topic', 'a specified topic')
    details = data.get('details', 'provide comprehensive and clear information.')
    complexity = data.get('complexity', 'intermediate')
    output_format = data.get('format', 'bullet_points')

    if not topic:
        return jsonify({"error": "Topic is required"}), 400

    # Construct the prompt for the AI model
    prompt = f"""
    Generate {content_type} on the topic of "{topic}" for {grade_level} students in the {subject_area} subject area.
    
    Here are additional details and requirements: "{details}"
    
    Ensure the complexity is {complexity}.
    
    Please present the content in {output_format.replace('_', ' ')} format.
    """

    try:
        # Initialize the Gemini model
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        # Call Gemini API to generate content
        response = model.generate_content(
            prompt
            # You can add generation config here, e.g., temperature, max_output_tokens
            # generation_config=genai.types.GenerationConfig(temperature=0.7, max_output_tokens=1500)
        )
        
        # Extract the content from the AI response
        # Gemini's response structure might vary slightly, typically accessible via .text
        ai_generated_content = response.text

        # Return the generated content as JSON
        return jsonify({"content": ai_generated_content})

    except Exception as e:
        print(f"Gemini API Error or other server error: {e}")
        # Check for specific error types if needed, e.g., API rate limits
        return jsonify({"error": f"Failed to generate content: {e}"}), 500

if __name__ == '__main__':
    # You can change the port if 5000 is already in use
    app.run(host='0.0.0.0', port=5000, debug=True)