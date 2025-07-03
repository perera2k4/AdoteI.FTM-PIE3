from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)

# Arquivos de dados
DATA_DIR = 'data'
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
POSTS_FILE = os.path.join(DATA_DIR, 'posts.json')
SESSIONS_FILE = os.path.join(DATA_DIR, 'sessions.json')

# Criar diretório de dados se não existir
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

# Inicializar arquivos JSON
def init_files():
    for file_path in [USERS_FILE, POSTS_FILE, SESSIONS_FILE]:
        if not os.path.exists(file_path):
            with open(file_path, 'w') as f:
                json.dump([], f)

init_files()

# Funções auxiliares
def load_json(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

def save_json(file_path, data):
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def get_user_from_session(session_id):
    sessions = load_json(SESSIONS_FILE)
    for session in sessions:
        if session.get('id') == session_id:
            return session.get('user')
    return None

# Middleware de autenticação
def authenticate_request():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Session '):
        return None
    
    session_id = auth_header[8:]  # Remove "Session "
    return get_user_from_session(session_id)

# Rotas existentes...

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    phone_number = data.get('phoneNumber', '')
    
    if not username or not password:
        return jsonify({'error': 'Username e password são obrigatórios'}), 400
    
    users = load_json(USERS_FILE)
    
    if any(user['username'] == username for user in users):
        return jsonify({'error': 'Usuário já existe'}), 400
    
    new_user = {
        'id': str(uuid.uuid4()),
        'username': username,
        'password': password,
        'phoneNumber': phone_number,
        'isAdmin': False,
        'createdAt': datetime.now().isoformat()
    }
    
    users.append(new_user)
    save_json(USERS_FILE, users)
    
    return jsonify({'message': 'Usuário criado com sucesso'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username e password são obrigatórios'}), 400
    
    users = load_json(USERS_FILE)
    user = next((u for u in users if u['username'] == username and u['password'] == password), None)
    
    if not user:
        return jsonify({'error': 'Credenciais inválidas'}), 401
    
    session_id = str(uuid.uuid4())
    session = {
        'id': session_id,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'phoneNumber': user.get('phoneNumber', ''),
            'isAdmin': user.get('isAdmin', False)
        },
        'created_at': datetime.now().isoformat(),
        'expires_at': (datetime.now().timestamp() + 1800) * 1000,  # 30 minutos
        'last_activity': datetime.now().isoformat()
    }
    
    sessions = load_json(SESSIONS_FILE)
    sessions.append(session)
    save_json(SESSIONS_FILE, sessions)
    
    return jsonify({
        'session_id': session_id,
        'user': session['user']
    })

@app.route('/logout', methods=['POST'])
def logout():
    user = authenticate_request()
    if not user:
        return jsonify({'error': 'Não autorizado'}), 401
    
    auth_header = request.headers.get('Authorization')
    session_id = auth_header[8:]
    
    sessions = load_json(SESSIONS_FILE)
    sessions = [s for s in sessions if s.get('id') != session_id]
    save_json(SESSIONS_FILE, sessions)
    
    return jsonify({'message': 'Logout realizado com sucesso'})

@app.route('/session-info', methods=['GET'])
def session_info():
    user = authenticate_request()
    if not user:
        return jsonify({'error': 'Não autorizado'}), 401
    
    auth_header = request.headers.get('Authorization')
    session_id = auth_header[8:]
    
    sessions = load_json(SESSIONS_FILE)
    session = next((s for s in sessions if s.get('id') == session_id), None)
    
    if not session:
        return jsonify({'error': 'Sessão não encontrada'}), 401
    
    expires_at = session.get('expires_at', 0)
    now = datetime.now().timestamp() * 1000
    time_remaining = max(0, int((expires_at - now) / 1000))
    
    return jsonify({
        'session': {
            'id': session['id'],
            'expires_at': datetime.fromtimestamp(expires_at / 1000).isoformat(),
            'time_remaining': time_remaining
        },
        'user': user
    })

@app.route('/posts', methods=['GET'])
def get_posts():
    posts = load_json(POSTS_FILE)
    # Filtrar apenas posts ativos (não adotados)
    active_posts = [post for post in posts if post.get('status') != 'adopted']
    return jsonify(active_posts)

@app.route('/posts', methods=['POST'])
def create_post():
    user = authenticate_request()
    if not user:
        return jsonify({'error': 'Não autorizado'}), 401
    
    data = request.get_json()
    title = data.get('title')
    description = data.get('description')
    
    if not title or not description:
        return jsonify({'error': 'Título e descrição são obrigatórios'}), 400
    
    new_post = {
        'id': str(uuid.uuid4()),
        'title': title,
        'description': description,
        'image': data.get('image', ''),
        'contact': data.get('contact', user.get('phoneNumber', '')),
        'location': data.get('location', ''),
        'category': data.get('category', 'outros'),
        'status': 'active',
        'userId': user['id'],
        'username': user['username'],
        'createdAt': datetime.now().isoformat(),
        'updatedAt': datetime.now().isoformat()
    }
    
    posts = load_json(POSTS_FILE)
    posts.append(new_post)
    save_json(POSTS_FILE, posts)
    
    return jsonify(new_post), 201

# 🆕 NOVAS ROTAS PARA PERFIL

@app.route('/my-posts', methods=['GET'])
def get_my_posts():
    user = authenticate_request()
    if not user:
        return jsonify({'error': 'Não autorizado'}), 401
    
    posts = load_json(POSTS_FILE)
    user_posts = [post for post in posts if post.get('userId') == user['id']]
    return jsonify(user_posts)

@app.route('/my-adopted', methods=['GET'])
def get_my_adopted():
    user = authenticate_request()
    if not user:
        return jsonify({'error': 'Não autorizado'}), 401
    
    posts = load_json(POSTS_FILE)
    adopted_posts = [post for post in posts if post.get('userId') == user['id'] and post.get('status') == 'adopted']
    return jsonify(adopted_posts)

@app.route('/adopt-post/<post_id>', methods=['POST'])
def adopt_post(post_id):
    user = authenticate_request()
    if not user:
        return jsonify({'error': 'Não autorizado'}), 401
    
    posts = load_json(POSTS_FILE)
    post_index = None
    
    for i, post in enumerate(posts):
        if post.get('id') == post_id:
            post_index = i
            break
    
    if post_index is None:
        return jsonify({'error': 'Post não encontrado'}), 404
    
    post = posts[post_index]
    
    # Verificar se o usuário é o dono do post
    if post.get('userId') != user['id']:
        return jsonify({'error': 'Você só pode arquivar seus próprios posts'}), 403
    
    # Marcar como adotado
    posts[post_index]['status'] = 'adopted'
    posts[post_index]['adoptedAt'] = datetime.now().isoformat()
    posts[post_index]['adoptedBy'] = user['username']
    posts[post_index]['updatedAt'] = datetime.now().isoformat()
    
    save_json(POSTS_FILE, posts)
    
    return jsonify({'message': 'Post marcado como adotado com sucesso', 'post': posts[post_index]})

@app.route('/reactivate-post/<post_id>', methods=['POST'])
def reactivate_post(post_id):
    user = authenticate_request()
    if not user:
        return jsonify({'error': 'Não autorizado'}), 401
    
    posts = load_json(POSTS_FILE)
    post_index = None
    
    for i, post in enumerate(posts):
        if post.get('id') == post_id:
            post_index = i
            break
    
    if post_index is None:
        return jsonify({'error': 'Post não encontrado'}), 404
    
    post = posts[post_index]
    
    # Verificar se o usuário é o dono do post
    if post.get('userId') != user['id']:
        return jsonify({'error': 'Você só pode reativar seus próprios posts'}), 403
    
    # Reativar post
    posts[post_index]['status'] = 'active'
    posts[post_index]['reactivatedAt'] = datetime.now().isoformat()
    posts[post_index]['updatedAt'] = datetime.now().isoformat()
    
    # Remover campos de adoção
    if 'adoptedAt' in posts[post_index]:
        del posts[post_index]['adoptedAt']
    if 'adoptedBy' in posts[post_index]:
        del posts[post_index]['adoptedBy']
    
    save_json(POSTS_FILE, posts)
    
    return jsonify({'message': 'Post reativado com sucesso', 'post': posts[post_index]})

@app.route('/delete-post/<post_id>', methods=['DELETE'])
def delete_post(post_id):
    user = authenticate_request()
    if not user:
        return jsonify({'error': 'Não autorizado'}), 401
    
    posts = load_json(POSTS_FILE)
    post_index = None
    
    for i, post in enumerate(posts):
        if post.get('id') == post_id:
            post_index = i
            break
    
    if post_index is None:
        return jsonify({'error': 'Post não encontrado'}), 404
    
    post = posts[post_index]
    
    # Verificar se o usuário é o dono do post
    if post.get('userId') != user['id']:
        return jsonify({'error': 'Você só pode deletar seus próprios posts'}), 403
    
    # Remover post
    posts.pop(post_index)
    save_json(POSTS_FILE, posts)
    
    return jsonify({'message': 'Post deletado permanentemente'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=3000)