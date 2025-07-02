from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import bcrypt
import base64
import jwt
import datetime
import os

app = Flask(__name__)

# CORS mais permissivo para produção
CORS(app, 
     origins=["*"],  # Permite todas as origens (só para teste)
     allow_headers=["Content-Type", "Authorization", "Accept"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)

# Configuração usando variáveis de ambiente
SECRET_KEY = os.environ.get("SECRET_KEY", "beef8000bc175089cadf2701a9979ac4")
MONGO_URI = os.environ.get("MONGO_URI", "mongodb+srv://devbrunocarvalho:jO7Uy2UqCwPmrLOl@adoteiftm.4lsu0xb.mongodb.net/?retryWrites=true&w=majority&appName=AdoteIFTM")

client = MongoClient(MONGO_URI)
db = client["AdoteIFTM"]
posts_collection = db["posts"]
adotados_collection = db["adotados"]
users_collection = db["users"]

# Função para proteger rotas
def token_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        if not token:
            return jsonify({'error': 'Token ausente!'}), 401
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user = users_collection.find_one({"username": data["username"]})
            if not current_user:
                return jsonify({'error': 'Usuário não encontrado!'}), 401
        except Exception as e:
            print(f"Erro na validação do token: {e}")  # Debug
            return jsonify({'error': 'Token inválido!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# Rota de teste
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "API AdoteIFTM funcionando!", 
        "status": "online",
        "endpoints": ["/login", "/register", "/posts", "/upload", "/adotados"]
    }), 200

# Rota para cadastro de usuário
@app.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Dados JSON inválidos"}), 400
            
        username = data.get("username")
        password = data.get("password")
        phone_number = data.get("phoneNumber")
        is_admin = data.get("isAdmin", False)

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
        print(f"Erro no registro: {e}")  # Debug
        return jsonify({"error": str(e)}), 500

# Rota para login de usuário (gera token JWT)
@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Dados JSON inválidos"}), 400
            
        username = data.get("username")
        password = data.get("password")

        print(f"Tentativa de login: {username}")  # Debug

        if not username or not password:
            return jsonify({"error": "Todos os campos são obrigatórios"}), 400

        user = users_collection.find_one({"username": username})

        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404

        if not bcrypt.checkpw(password.encode("utf-8"), user["password"].encode("utf-8")):
            return jsonify({"error": "Senha incorreta"}), 401

        # Gera o token JWT
        token = jwt.encode({
            "username": user["username"],
            "isAdmin": user.get("isAdmin", False),
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2)
        }, SECRET_KEY, algorithm="HS256")

        print(f"Login bem-sucedido: {username}")  # Debug

        return jsonify({
            "message": "Login realizado com sucesso!",
            "username": user["username"],
            "isAdmin": user.get("isAdmin", False),
            "token": token
        }), 200
    except Exception as e:
        print(f"Erro no login: {e}")  # Debug
        return jsonify({"error": str(e)}), 500

# Rota para criar um post (protegida)
@app.route("/upload", methods=["POST"])
@token_required
def upload_post(current_user):
    try:
        title = request.form.get("title")
        description = request.form.get("description")
        animal_type = request.form.get("animalType")
        image = request.files.get("image")
        username = current_user["username"]

        if not title or not description or not animal_type or not image:
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
        print(f"Erro no upload: {e}")  # Debug
        return jsonify({"error": str(e)}), 500

# Rota para listar todos os posts (pública)
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
        print(f"Erro ao buscar posts: {e}")  # Debug
        return jsonify({"error": str(e)}), 500

# Rota para listar todos os posts adotados (pública)
@app.route("/adotados", methods=["GET"])
def get_adotados():
    try:
        adotados = list(adotados_collection.find({}))
        for post in adotados:
            post["_id"] = str(post["_id"])
        return jsonify(adotados), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Iniciando servidor na porta {port}")  # Debug
    app.run(host="0.0.0.0", port=port, debug=False)