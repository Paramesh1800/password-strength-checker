import secrets
import string
import logging
import hashlib
import requests
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route("/save_password", methods=["POST"])
def save_password():
    data = request.get_json()
    password = data.get("password") if data else None
    logger.info(f"Captured password for analysis.")
    return jsonify({"status": "received", "length": len(password) if password else 0})

@app.route("/generate_password")
def generate_password():
    user_input = request.args.get('username', '')
    
    # Character sets for strengthening
    digits = string.digits
    special = "!@#$%^&*"
    
    if not user_input:
        # If no input, just generate a completely random strong one
        alphabet = string.ascii_letters + digits + special
        password = ''.join(secrets.choice(alphabet) for _ in range(12))
        return jsonify({"password": password})

    # 1. Start with the user input (First letter capitalized)
    base = user_input.replace(" ", "").capitalize()
    
    # 2. Apply a light, recognizable Leetspeak
    transform_map = {'a': '@', 'e': '3', 'i': '!', 'o': '0'}
    recognizable_base = "".join(transform_map.get(c.lower(), c) if i > 0 else c for i, c in enumerate(base))

    # 3. Append security requirements: Special Char + Random Numbers
    suffix = secrets.choice(special) + "".join(secrets.choice(digits) for _ in range(3))
    
    password = recognizable_base + suffix
    return jsonify({"password": password})

@app.route("/check_pwned", methods=["POST"])
def check_pwned():
    data = request.get_json()
    password = data.get("password")
    if not password:
        return jsonify({"error": "No password provided"}), 400
    
    # HIBP uses k-anonymity: send only first 5 chars of hash
    sha1_hash = hashlib.sha1(password.encode('utf-8')).hexdigest().upper()
    prefix = sha1_hash[:5]
    suffix = sha1_hash[5:]
    
    try:
        response = requests.get(f"https://api.pwnedpasswords.com/range/{prefix}")
        if response.status_code != 200:
            return jsonify({"error": "Failed to check breach database"}), 500
        
        hashes = (line.split(':') for line in response.text.splitlines())
        count = 0
        for h, c in hashes:
            if h == suffix:
                count = int(c)
                break
        
        return jsonify({"pwned": count > 0, "count": count})
    except Exception as e:
        logger.error(f"HIBP check error: {str(e)}")
        return jsonify({"error": "Breach database unreachable"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
