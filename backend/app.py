from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import bcrypt
import base64
import jwt
import datetime
import os
import uuid

app = Flask(__name__)

# CORS
CORS(app, 
     origins=[
         "http://localhost:3000",
         "http://localhost:5173",
         "http://127.0.0.1:5173",
         "https://adote-i-ftm-pie-3.vercel.app",
         "https://*.vercel.app"
     ],
     allow_headers=["Content-Type", "Authorization", "Accept", "X-Requested-With", "Origin"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     supports_credentials=True
)

# Configuração
SECRET_KEY = os.environ.get("SECRET_KEY", "beef8000bc175089cadf2701a9979ac4")
MONGO_URI = os.environ.get("MONGO_URI", "mongodb+srv://devbrunocarvalho:jO7Uy2UqCwPmrLOl@adoteiftm.4lsu0xb.mongodb.net/?retryWrites=true&w=majority&appName=AdoteIFTM")

# Configuração de sessão
SESSION_TIMEOUT = 600  # 10 minutos em segundos

try:
    client = MongoClient(MONGO_URI)
    db = client["AdoteIFTM"]
    posts_collection = db["posts"]
    adotados_collection = db["adotados"]
    users_collection = db["users"]
    sessions_collection = db["sessions"]  # Nova coleção para sessões
    
    client.admin.command('ping')
    print("✅ MongoDB conectado com sucesso!")
except Exception as e:
    print(f"❌ Erro na conexão MongoDB: {e}")

@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    allowed_origins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://adote-i-ftm-pie-3.vercel.app'
    ]
    
    if origin in allowed_origins:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,Accept,X-Requested-With,Origin'
        response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    
    return response

# Funções auxiliares para sessões
def create_session(username):
    """Cria uma nova sessão para o usuário"""
    session_id = str(uuid.uuid4())
    session_data = {
        "session_id": session_id,
        "username": username,
        "created_at": datetime.datetime.utcnow(),
        "last_activity": datetime.datetime.utcnow(),
        "expires_at": datetime.datetime.utcnow() + datetime.timedelta(seconds=SESSION_TIMEOUT)
    }
    
    # Remove sessões antigas do usuário
    sessions_collection.delete_many({"username": username})
    
    # Cria nova sessão
    sessions_collection.insert_one(session_data)
    
    print(f"✅ Sessão criada para {username}: {session_id}")
    return session_id

def validate_session(session_id):
    """Valida se a sessão existe e não expirou"""
    if not session_id:
        return None
        
    session = sessions_collection.find_one({"session_id": session_id})
    
    if not session:
        print(f"❌ Sessão não encontrada: {session_id}")
        return None
    
    # Verifica se expirou
    if datetime.datetime.utcnow() > session["expires_at"]:
        print(f"⏰ Sessão expirada: {session_id}")
        sessions_collection.delete_one({"session_id": session_id})
        return None
    
    # Atualiza última atividade
    sessions_collection.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "last_activity": datetime.datetime.utcnow(),
                "expires_at": datetime.datetime.utcnow() + datetime.timedelta(seconds=SESSION_TIMEOUT)
            }
        }
    )
    
    return session

def get_user_from_session(session_id):
    """Retorna dados do usuário baseado na sessão"""
    session = validate_session(session_id)
    if not session:
        return None
    
    user = users_collection.find_one({"username": session["username"]})
    return user

def delete_session(session_id):
    """Remove uma sessão específica"""
    if session_id:
        sessions_collection.delete_one({"session_id": session_id})
        print(f"🗑️ Sessão removida: {session_id}")

def cleanup_expired_sessions():
    """Remove todas as sessões expiradas"""
    result = sessions_collection.delete_many({
        "expires_at": {"$lt": datetime.datetime.utcnow()}
    })
    if result.deleted_count > 0:
        print(f"🧹 {result.deleted_count} sessões expiradas removidas")

# Decorator para rotas protegidas
def session_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        session_id = None
        
        # Busca session_id no header Authorization
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith("Session "):
                session_id = auth_header.split(" ")[1]
        
        if not session_id:
            return jsonify({'error': 'Sessão não fornecida!'}), 401
        
        current_user = get_user_from_session(session_id)
        if not current_user:
            return jsonify({'error': 'Sessão inválida ou expirada!'}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

# Rotas da API
@app.route("/", methods=["GET"])
def home():
    cleanup_expired_sessions()  # Limpeza automática
    return jsonify({
        "message": "🎉 API AdoteIFTM funcionando!", 
        "status": "online",
        "version": "2.0.0",
        "session_timeout": f"{SESSION_TIMEOUT}s",
        "endpoints": {
            "login": "POST /login",
            "register": "POST /register", 
            "logout": "POST /logout",
            "session-info": "GET /session-info",
            "posts": "GET /posts",
            "upload": "POST /upload (protegida)",
            "user/posts": "GET /user/posts (protegida)",
            "posts/<id>": "DELETE /posts/<id> (protegida)",
            "adotados": "GET /adotados"
        }
    }), 200

@app.route("/register", methods=["POST", "OPTIONS"])
def register():
    if request.method == "OPTIONS":
        return jsonify({}), 200
        
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
            "isAdmin": is_admin,
            "created_at": datetime.datetime.utcnow()
        }
        
        users_collection.insert_one(user)
        print(f"✅ Usuário criado: {username}")

        return jsonify({"message": "Usuário cadastrado com sucesso!"}), 201
    except Exception as e:
        print(f"❌ Erro no registro: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return jsonify({}), 200
        
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Dados JSON inválidos"}), 400
            
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"error": "Todos os campos são obrigatórios"}), 400

        user = users_collection.find_one({"username": username})

        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404

        if not bcrypt.checkpw(password.encode("utf-8"), user["password"].encode("utf-8")):
            return jsonify({"error": "Senha incorreta"}), 401

        # Cria sessão
        session_id = create_session(username)

        print(f"✅ Login bem-sucedido: {username}")

        return jsonify({
            "message": "Login realizado com sucesso!",
            "sessionId": session_id,  # Mudança aqui: era "session_id"
            "user": {
                "username": user["username"],
                "isAdmin": user.get("isAdmin", False),
                "phoneNumber": user.get("phoneNumber")
            },
            "expires_in": SESSION_TIMEOUT
        }), 200
    except Exception as e:
        print(f"❌ Erro no login: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/logout", methods=["POST", "OPTIONS"])
def logout():
    if request.method == "OPTIONS":
        return jsonify({}), 200
        
    try:
        session_id = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith("Session "):
                session_id = auth_header.split(" ")[1]
        
        if session_id:
            delete_session(session_id)
        
        return jsonify({"message": "Logout realizado com sucesso!"}), 200
    except Exception as e:
        print(f"❌ Erro no logout: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/session-info", methods=["GET", "OPTIONS"])
@session_required
def session_info(current_user):
    if request.method == "OPTIONS":
        return jsonify({}), 200
        
    try:
        session_id = request.headers.get('Authorization', '').replace('Session ', '')
        session = sessions_collection.find_one({"session_id": session_id})
        
        return jsonify({
            "user": {
                "username": current_user["username"],
                "isAdmin": current_user.get("isAdmin", False),
                "phoneNumber": current_user.get("phoneNumber")
            },
            "session": {
                "created_at": session["created_at"].isoformat(),
                "last_activity": session["last_activity"].isoformat(),
                "expires_at": session["expires_at"].isoformat(),
                "time_remaining": int((session["expires_at"] - datetime.datetime.utcnow()).total_seconds())
            }
        }), 200
    except Exception as e:
        print(f"❌ Erro ao buscar info da sessão: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/upload", methods=["POST", "OPTIONS"])
@session_required
def upload_post(current_user):
    if request.method == "OPTIONS":
        return jsonify({}), 200
        
    try:
        print(f"📤 Recebendo upload do usuário: {current_user['username']}")
        
        title = request.form.get("title")
        description = request.form.get("description")
        animal_type = request.form.get("animalType")
        image = request.files.get("image")
        username = current_user["username"]

        print(f"📝 Dados recebidos: title={title}, description={description}, animalType={animal_type}, image={image.filename if image else None}")

        if not title or not description or not animal_type or not image:
            missing_fields = []
            if not title: missing_fields.append("title")
            if not description: missing_fields.append("description")
            if not animal_type: missing_fields.append("animalType")
            if not image: missing_fields.append("image")
            return jsonify({"error": f"Campos obrigatórios faltando: {', '.join(missing_fields)}"}), 400

        # Verificar se o arquivo de imagem não está vazio
        if image.filename == '':
            return jsonify({"error": "Nenhuma imagem selecionada"}), 400

        # Converter imagem para base64
        image_data = image.read()
        image_base64 = base64.b64encode(image_data).decode("utf-8")

        post = {
            "title": title,
            "description": description,
            "animalType": animal_type,
            "image": image_base64,
            "username": username,
            "created_at": datetime.datetime.utcnow()
        }

        result = posts_collection.insert_one(post)
        post["_id"] = str(result.inserted_id)

        print(f"✅ Post criado com sucesso: {post['_id']}")
        return jsonify({"message": "Post criado com sucesso!", "post": post}), 201
    except Exception as e:
        print(f"❌ Erro no upload: {e}")
        return jsonify({"error": str(e)}), 500

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
        print(f"❌ Erro ao buscar posts: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/user/posts", methods=["GET", "OPTIONS"])
@session_required
def get_user_posts(current_user):
    if request.method == "OPTIONS":
        return jsonify({}), 200
        
    try:
        posts = list(posts_collection.find({"username": current_user["username"]}))
        for post in posts:
            post["_id"] = str(post["_id"])
            post["phoneNumber"] = current_user.get("phoneNumber", None)
        
        return jsonify(posts), 200
    except Exception as e:
        print(f"❌ Erro ao buscar posts do usuário: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/posts/<post_id>", methods=["DELETE", "OPTIONS"])
@session_required
def delete_post(current_user, post_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200
        
    try:
        from bson import ObjectId
        
        # Verificar se o post existe e pertence ao usuário
        post = posts_collection.find_one({"_id": ObjectId(post_id), "username": current_user["username"]})
        
        if not post:
            return jsonify({"error": "Post não encontrado ou não autorizado"}), 404
        
        # Deletar o post
        result = posts_collection.delete_one({"_id": ObjectId(post_id)})
        
        if result.deleted_count == 1:
            print(f"✅ Post deletado: {post_id}")
            return jsonify({"message": "Post deletado com sucesso!"}), 200
        else:
            return jsonify({"error": "Erro ao deletar post"}), 500
            
    except Exception as e:
        print(f"❌ Erro ao deletar post: {e}")
        return jsonify({"error": str(e)}), 500

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
    print(f"🚀 Iniciando servidor na porta {port}")
    print(f"⏰ Timeout de sessão: {SESSION_TIMEOUT}s")
    app.run(host="0.0.0.0", port=port, debug=False)