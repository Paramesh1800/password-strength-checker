from flask import Flask, render_template, request

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/save_password", methods=["POST"])
def save_password():
    data = request.get_json()
    password = data.get("password") if data else None
    print("Password received:", password)
    return "Password saved (check console)"

if __name__ == "__main__":
    app.run(debug=True)
