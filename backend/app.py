from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import bcrypt
import base64

app = Flask(__name__)
CORS(app)

# Configuração do MongoDB
MONGO_URI = "mongodb+srv://devbrunocarvalho:jO7Uy2UqCwPmrLOl@adoteiftm.4lsu0xb.mongodb.net/?retryWrites=true&w=majority&appName=AdoteIFTM"
client = MongoClient(MONGO_URI)
db = client["AdoteIFTM"]
posts_collection = db["posts"]
adotados_collection = db["adotados"]
users_collection = db["users"]

# Rota para cadastro de usuário
@app.route("/register", methods=["POST"])
def register():
    try:
        username = request.json.get("username")
        password = request.json.get("password")
        phone_number = request.json.get("phoneNumber")
        is_admin = request.json.get("isAdmin", False)

        if not username or not password or not phone_number:
            return jsonify({"error": "Todos os campos são obrigatórios"}), 400

        if users_collection.find_one({"username": username}):
            return jsonify({"error": "Usuário já existe"}), 400

        hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

        user = {
            "username": username,
            "password": hashed_password.decode("utf-8"),
            "phoneNumber": phone_number,
            "isAdmin": is_admin
        }
        users_collection.insert_one(user)

        return jsonify({"message": "Usuário cadastrado com sucesso!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Rota para login de usuário
@app.route("/login", methods=["POST"])
def login():
    try:
        username = request.json.get("username")
        password = request.json.get("password")

        if not username or not password:
            return jsonify({"error": "Todos os campos são obrigatórios"}), 400

        user = users_collection.find_one({"username": username})
        print("Usuário encontrado no banco de dados:", user)  # Log para depuração

        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404

        if not bcrypt.checkpw(password.encode("utf-8"), user["password"].encode("utf-8")):
            return jsonify({"error": "Senha incorreta"}), 401

        return jsonify({
            "message": "Login realizado com sucesso!",
            "username": user["username"],
            "isAdmin": user.get("isAdmin", False)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Rota para criar um post
@app.route("/upload", methods=["POST"])
def upload_post():
    try:
        title = request.form.get("title")
        description = request.form.get("description")
        animal_type = request.form.get("animalType")
        image = request.files.get("image")
        username = request.form.get("username")

        if not title or not description or not animal_type or not image or not username:
            return jsonify({"error": "Todos os campos são obrigatórios"}), 400

        image_base64 = base64.b64encode(image.read()).decode("utf-8")

        post = {
            "title": title,
            "description": description,
            "animalType": animal_type,
            "image": image_base64,
            "username": username
        }

        result = posts_collection.insert_one(post)
        post["_id"] = str(result.inserted_id)

        return jsonify({"message": "Post criado com sucesso!", "post": post}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Rota para listar todos os posts
@app.route("/posts", methods=["GET"])
def get_posts():
    try:
        posts = list(posts_collection.find({}))
        for post in posts:
            post["_id"] = str(post["_id"])
            user = users_collection.find_one({"username": post["username"]})
            if user:
                post["phoneNumber"] = user.get("phoneNumber", None)
        return jsonify(posts), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Rota para listar todos os posts adotados
@app.route("/adotados", methods=["GET"])
def get_adotados():
    try:
        adotados = list(adotados_collection.find({}))
        for post in adotados:
            post["_id"] = str(post["_id"])
        return jsonify(adotados), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Iniciar o servidor
if __name__ == "__main__":
    app.run(debug=True)