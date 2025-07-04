from flask import Flask, request, jsonify, session
from flask_cors import CORS
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
import os
from datetime import datetime, timedelta
import base64
import secrets
import json

app = Flask(__name__)

# Configuração do CORS
CORS(app, 
     origins=['http://localhost:5173', 'http://127.0.0.1:5173', 'https://adote-iftm-backend.onrender.com'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
     supports_credentials=True)

# Configuração da aplicação
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_hex(32))
app.config['SESSION_COOKIE_SECURE'] = False  # Para desenvolvimento
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Configuração do MongoDB
try:
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/adote_iftm')
    client = MongoClient(MONGO_URI)
    db = client.adote_iftm
    
    # Testar conexão
    client.admin.command('ping')
    
    # Coleções
    users_collection = db.users
    posts_collection = db.posts
    adopted_collection = db.adopted
    
    print("✅ Conectado ao MongoDB com sucesso")
    
except Exception as e:
    print(f"❌ Erro ao conectar com MongoDB: {e}")
    db = None
    users_collection = None
    posts_collection = None
    adopted_collection = None

# Middleware para verificar se o banco está conectado
def check_db():
    if db is None:
        return jsonify({'error': 'Banco de dados não disponível'}), 503
    return None

# Middleware para verificar autenticação
def require_auth():
    if 'username' not in session:
        return jsonify({'error': 'Não autorizado'}), 401
    return None

# Função para serializar documentos MongoDB
def serialize_doc(doc):
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        serialized = {}
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                serialized[key] = str(value)
            elif isinstance(value, datetime):
                serialized[key] = value.isoformat()
            elif isinstance(value, dict):
                serialized[key] = serialize_doc(value)
            elif isinstance(value, list):
                serialized[key] = [serialize_doc(item) for item in value]
            else:
                serialized[key] = value
        return serialized
    return doc

# Rota raiz
@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'message': 'API Adote IFTM',
        'status': 'running',
        'version': '1.0.0',
        'endpoints': {
            'auth': ['/register', '/login', '/logout', '/session-info'],
            'posts': ['/posts', '/posts/<id>'],
            'adopted': ['/adotados', '/adotados/<id>'],
            'upload': ['/upload'],
            'health': ['/health']
        }
    }), 200

# Rota de health check
@app.route('/health', methods=['GET'])
def health_check():
    db_status = 'connected' if db else 'disconnected'
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'database': db_status,
        'environment': os.environ.get('FLASK_ENV', 'production')
    }), 200

# === ROTAS DE AUTENTICAÇÃO ===

@app.route('/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return '', 200
    
    db_error = check_db()
    if db_error:
        return db_error
    
    try:
        data = request.get_json()
        print(f"📝 Tentativa de registro: {data}")
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username e password são obrigatórios'}), 400
        
        username = data['username'].strip()
        password = data['password']
        phone_number = data.get('phoneNumber', '').strip()
        
        # Verificar se o usuário já existe
        if users_collection.find_one({'username': username}):
            return jsonify({'error': 'Usuário já existe'}), 400
        
        # Criar novo usuário
        user_doc = {
            'username': username,
            'password': generate_password_hash(password),
            'phoneNumber': phone_number,
            'isAdmin': False,
            'created_at': datetime.utcnow()
        }
        
        result = users_collection.insert_one(user_doc)
        
        if result.inserted_id:
            print(f"✅ Usuário registrado: {username}")
            return jsonify({'message': 'Usuário registrado com sucesso'}), 201
        else:
            return jsonify({'error': 'Erro ao registrar usuário'}), 500
            
    except Exception as e:
        print(f"❌ Erro no registro: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 200
    
    db_error = check_db()
    if db_error:
        return db_error
    
    try:
        data = request.get_json()
        print(f"🔐 Tentativa de login: {data}")
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username e password são obrigatórios'}), 400
        
        username = data['username'].strip()
        password = data['password']
        
        # Buscar usuário
        user = users_collection.find_one({'username': username})
        
        if not user:
            print(f"❌ Usuário não encontrado: {username}")
            return jsonify({'error': 'Credenciais inválidas'}), 401
        
        if not check_password_hash(user['password'], password):
            print(f"❌ Senha incorreta para: {username}")
            return jsonify({'error': 'Credenciais inválidas'}), 401
        
        # Criar sessão
        session['username'] = username
        session['isAdmin'] = user.get('isAdmin', False)
        session['phoneNumber'] = user.get('phoneNumber', '')
        
        print(f"✅ Login realizado: {username}")
        
        return jsonify({
            'message': 'Login realizado com sucesso',
            'user': {
                'username': username,
                'isAdmin': user.get('isAdmin', False),
                'phoneNumber': user.get('phoneNumber', '')
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Erro no login: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/logout', methods=['POST', 'OPTIONS'])
def logout():
    if request.method == 'OPTIONS':
        return '', 200
    
    username = session.get('username', 'Usuário desconhecido')
    session.clear()
    print(f"👋 Logout realizado: {username}")
    return jsonify({'message': 'Logout realizado com sucesso'}), 200

@app.route('/session-info', methods=['GET', 'OPTIONS'])
def session_info():
    if request.method == 'OPTIONS':
        return '', 200
    
    if 'username' not in session:
        return jsonify({'error': 'Não autenticado'}), 401
    
    return jsonify({
        'username': session['username'],
        'isAdmin': session.get('isAdmin', False),
        'phoneNumber': session.get('phoneNumber', '')
    }), 200

# === ROTAS DE POSTS ===

@app.route('/posts', methods=['GET', 'OPTIONS'])
def get_posts():
    if request.method == 'OPTIONS':
        return '', 200
    
    db_error = check_db()
    if db_error:
        return db_error
    
    try:
        posts = list(posts_collection.find().sort('created_at', -1))
        print(f"📋 Buscando posts: {len(posts)} encontrados")
        return jsonify(serialize_doc(posts)), 200
    except Exception as e:
        print(f"❌ Erro ao buscar posts: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/posts', methods=['POST'])
def create_post():
    db_error = check_db()
    if db_error:
        return db_error
    
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        data = request.get_json()
        print(f"📝 Criando post: {data}")
        
        if not data or not data.get('title'):
            return jsonify({'error': 'Título é obrigatório'}), 400
        
        post_doc = {
            'title': data['title'].strip(),
            'description': data.get('description', '').strip(),
            'animalType': data.get('animalType', 'dog'),
            'image': data.get('image', ''),
            'username': session['username'],
            'phoneNumber': session.get('phoneNumber', ''),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = posts_collection.insert_one(post_doc)
        
        if result.inserted_id:
            post_doc['_id'] = str(result.inserted_id)
            print(f"✅ Post criado: {result.inserted_id}")
            return jsonify(serialize_doc(post_doc)), 201
        else:
            return jsonify({'error': 'Erro ao criar post'}), 500
            
    except Exception as e:
        print(f"❌ Erro ao criar post: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/posts/<post_id>', methods=['GET', 'OPTIONS'])
def get_post(post_id):
    if request.method == 'OPTIONS':
        return '', 200
    
    db_error = check_db()
    if db_error:
        return db_error
    
    try:
        if not ObjectId.is_valid(post_id):
            return jsonify({'error': 'ID inválido'}), 400
        
        post = posts_collection.find_one({'_id': ObjectId(post_id)})
        
        if not post:
            return jsonify({'error': 'Post não encontrado'}), 404
        
        return jsonify(serialize_doc(post)), 200
        
    except Exception as e:
        print(f"❌ Erro ao buscar post: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/posts/<post_id>', methods=['PUT', 'OPTIONS'])
def update_post(post_id):
    if request.method == 'OPTIONS':
        return '', 200
    
    db_error = check_db()
    if db_error:
        return db_error
    
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        if not ObjectId.is_valid(post_id):
            return jsonify({'error': 'ID inválido'}), 400
        
        data = request.get_json()
        print(f"✏️ Atualizando post {post_id}: {data}")
        
        if not data:
            return jsonify({'error': 'Dados são obrigatórios'}), 400
        
        # Buscar o post existente
        existing_post = posts_collection.find_one({'_id': ObjectId(post_id)})
        
        if not existing_post:
            return jsonify({'error': 'Post não encontrado'}), 404
        
        # Verificar se o usuário é o dono do post ou admin
        if existing_post['username'] != session['username'] and not session.get('isAdmin', False):
            return jsonify({'error': 'Não autorizado a editar este post'}), 403
        
        # Preparar dados para atualização
        update_data = {
            'updated_at': datetime.utcnow()
        }
        
        # Atualizar campos fornecidos
        if 'title' in data:
            update_data['title'] = data['title'].strip()
        if 'description' in data:
            update_data['description'] = data['description'].strip()
        if 'animalType' in data:
            update_data['animalType'] = data['animalType']
        if 'image' in data:
            update_data['image'] = data['image']
        
        # Atualizar o post
        result = posts_collection.update_one(
            {'_id': ObjectId(post_id)},
            {'$set': update_data}
        )
        
        if result.modified_count > 0:
            # Buscar o post atualizado
            updated_post = posts_collection.find_one({'_id': ObjectId(post_id)})
            print(f"✅ Post atualizado: {post_id}")
            return jsonify(serialize_doc(updated_post)), 200
        else:
            return jsonify({'error': 'Nenhuma alteração realizada'}), 400
            
    except Exception as e:
        print(f"❌ Erro ao atualizar post: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/posts/<post_id>', methods=['DELETE', 'OPTIONS'])
def delete_post(post_id):
    if request.method == 'OPTIONS':
        return '', 200
    
    db_error = check_db()
    if db_error:
        return db_error
    
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        if not ObjectId.is_valid(post_id):
            return jsonify({'error': 'ID inválido'}), 400
        
        # Buscar o post existente
        existing_post = posts_collection.find_one({'_id': ObjectId(post_id)})
        
        if not existing_post:
            return jsonify({'error': 'Post não encontrado'}), 404
        
        # Verificar se o usuário é o dono do post ou admin
        if existing_post['username'] != session['username'] and not session.get('isAdmin', False):
            return jsonify({'error': 'Não autorizado a deletar este post'}), 403
        
        # Deletar o post
        result = posts_collection.delete_one({'_id': ObjectId(post_id)})
        
        if result.deleted_count > 0:
            print(f"🗑️ Post deletado: {post_id}")
            return jsonify({'message': 'Post deletado com sucesso'}), 200
        else:
            return jsonify({'error': 'Erro ao deletar post'}), 500
            
    except Exception as e:
        print(f"❌ Erro ao deletar post: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

# === ROTAS DE PETS ADOTADOS ===

@app.route('/adotados', methods=['GET', 'OPTIONS'])
def get_adopted_pets():
    if request.method == 'OPTIONS':
        return '', 200
    
    db_error = check_db()
    if db_error:
        return db_error
    
    try:
        adopted_pets = list(adopted_collection.find().sort('adopted_date', -1))
        print(f"🏠 Buscando pets adotados: {len(adopted_pets)} encontrados")
        return jsonify(serialize_doc(adopted_pets)), 200
    except Exception as e:
        print(f"❌ Erro ao buscar pets adotados: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/adotados', methods=['POST', 'OPTIONS'])
def create_adopted_pet():
    if request.method == 'OPTIONS':
        return '', 200
    
    db_error = check_db()
    if db_error:
        return db_error
    
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        data = request.get_json()
        print(f"🏠 Marcando pet como adotado: {data}")
        
        if not data:
            return jsonify({'error': 'Dados são obrigatórios'}), 400
        
        # Preparar documento para pets adotados
        adopted_doc = {
            'title': data.get('title', ''),
            'description': data.get('description', ''),
            'animalType': data.get('animalType', 'dog'),
            'image': data.get('image', ''),
            'username': data.get('username', session['username']),
            'phoneNumber': data.get('phoneNumber', session.get('phoneNumber', '')),
            'original_post_id': data.get('original_post_id', ''),
            'adopted_date': datetime.utcnow(),
            'adopted_by': session['username'],
            'created_at': data.get('created_at', datetime.utcnow())
        }
        
        result = adopted_collection.insert_one(adopted_doc)
        
        if result.inserted_id:
            adopted_doc['_id'] = str(result.inserted_id)
            print(f"✅ Pet marcado como adotado: {result.inserted_id}")
            return jsonify(serialize_doc(adopted_doc)), 201
        else:
            return jsonify({'error': 'Erro ao marcar pet como adotado'}), 500
            
    except Exception as e:
        print(f"❌ Erro ao criar registro de adoção: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

# === ROTA DE UPLOAD ===

@app.route('/upload', methods=['POST', 'OPTIONS'])
def upload_image():
    if request.method == 'OPTIONS':
        return '', 200
    
    auth_error = require_auth()
    if auth_error:
        return auth_error
    
    try:
        data = request.get_json()
        
        if not data or not data.get('image'):
            return jsonify({'error': 'Imagem é obrigatória'}), 400
        
        # Validar se é uma imagem base64 válida
        image_data = data['image']
        if not image_data.startswith('data:image'):
            return jsonify({'error': 'Formato de imagem inválido'}), 400
        
        # Remover o prefixo da imagem base64
        image_base64 = image_data.split(',')[1] if ',' in image_data else image_data
        
        # Validar base64
        try:
            base64.b64decode(image_base64)
        except Exception:
            return jsonify({'error': 'Dados de imagem inválidos'}), 400
        
        print(f"📸 Upload processado com sucesso")
        return jsonify({
            'message': 'Imagem processada com sucesso',
            'imageData': image_base64
        }), 200
        
    except Exception as e:
        print(f"❌ Erro no upload: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

# === TRATAMENTO DE ERROS ===

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint não encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
    print(f"❌ Erro interno: {error}")
    return jsonify({'error': 'Erro interno do servidor'}), 500

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({'error': 'Método não permitido'}), 405

# === MIDDLEWARE PARA CORS ===

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({'message': 'OK'})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        return response

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# === INICIALIZAÇÃO ===

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"🚀 Servidor iniciando na porta {port}")
    print(f"🔧 Debug mode: {debug}")
    print(f"🌐 CORS configurado para: localhost:5173")
    
    app.run(host='0.0.0.0', port=port, debug=debug)