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
        # Obter dados do formulário
        username = request.json.get("username")
        password = request.json.get("password")

        if not username or not password:
            return jsonify({"error": "Todos os campos são obrigatórios"}), 400

        # Verificar se o usuário já existe
        if users_collection.find_one({"username": username}):
            return jsonify({"error": "Usuário já existe"}), 400

        # Hash da senha
        hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

        # Criar o usuário
        user = {"username": username, "password": hashed_password.decode("utf-8")}
        users_collection.insert_one(user)

        return jsonify({"message": "Usuário cadastrado com sucesso!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Rota para login de usuário
@app.route("/login", methods=["POST"])
def login():
    try:
        # Obter dados do formulário
        username = request.json.get("username")
        password = request.json.get("password")

        if not username or not password:
            return jsonify({"error": "Todos os campos são obrigatórios"}), 400

        # Verificar se o usuário existe
        user = users_collection.find_one({"username": username})
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404

        # Verificar a senha
        if not bcrypt.checkpw(password.encode("utf-8"), user["password"].encode("utf-8")):
            return jsonify({"error": "Senha incorreta"}), 401

        return jsonify({"message": "Login realizado com sucesso!", "username": user["username"]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Rota para criar um post
@app.route("/upload", methods=["POST"])
def upload_post():
    try:
        # Obter dados do formulário
        title = request.form.get("title")
        description = request.form.get("description")
        animal_type = request.form.get("animalType")
        image = request.files.get("image")
        username = request.form.get("username")  # Nome do usuário que fez a publicação

        if not title or not description or not animal_type or not image or not username:
            return jsonify({"error": "Todos os campos são obrigatórios"}), 400

        # Converter a imagem para base64
        image_base64 = base64.b64encode(image.read()).decode("utf-8")

        # Criar o post
        post = {
            "title": title,
            "description": description,
            "animalType": animal_type,
            "image": image_base64,  # Armazenar a imagem como base64
            "username": username,  # Nome do usuário que fez a publicação
        }

        # Inserir o post no MongoDB
        result = posts_collection.insert_one(post)

        # Adicionar o ID ao post criado
        post["_id"] = str(result.inserted_id)

        return jsonify({"message": "Post criado com sucesso!", "post": post}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Rota para listar todos os posts
@app.route("/posts", methods=["GET"])
def get_posts():
    try:
        posts = list(posts_collection.find({}, {"_id": 0}))
        return jsonify(posts), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Rota para deletar um post
@app.route("/posts/<title>", methods=["DELETE"])
def delete_post(title):
    try:
        # Buscar o post pelo título
        post = posts_collection.find_one({"title": title})
        if not post:
            return jsonify({"error": "Post não encontrado"}), 404

        # Mover o post para a coleção "adotados"
        adotados_collection.insert_one(post)

        # Remover o post da coleção "posts"
        posts_collection.delete_one({"title": title})

        return jsonify({"message": "Post deletado e movido para adotados!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Rota para listar todos os posts adotados
@app.route("/adotados", methods=["GET"])
def get_adotados():
    try:
        adotados = list(adotados_collection.find({}, {"_id": 0}))
        return jsonify(adotados), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Iniciar o servidor
if __name__ == "__main__":
    app.run(debug=True)