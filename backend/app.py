import eventlet
eventlet.monkey_patch()

import json
import os
import ssl
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from flask_cors import CORS
from flask_socketio import SocketIO, emit

# Get the absolute path to the directory where app.py is located
backend_dir = os.path.dirname(os.path.abspath(__file__))
# The dist folder is one level up from the backend folder
dist_dir = os.path.abspath(os.path.join(backend_dir, '..', 'dist'))

# Initialize Flask with the absolute path to the static folder
app = Flask(__name__, static_folder=dist_dir, static_url_path='/')
# Robust CORS for development and production
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Initialize SocketIO early to avoid NameError
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# Database Configuration
# Use environment variable for production, fallback to hardcoded only for local/dev
DEFAULT_DB_URL = "postgresql://postgres:yuvrajsupapassword@db.phujsimyxqvfbxjswrvg.supabase.co:5432/postgres?sslmode=require"
db_url = os.environ.get("DATABASE_URL", DEFAULT_DB_URL)

# Clean and transform the URL for SQLAlchemy compatibility
if db_url:
    # Force pg8000 driver for compatibility with Python 3.13 on Render
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+pg8000://", 1)
    elif db_url.startswith("postgresql://") and "+pg8000" not in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+pg8000://", 1)
    
    # pg8000 does not support 'sslmode' in the connection string.
    if "sslmode=" in db_url:
        import urllib.parse as urlparse
        url_parts = list(urlparse.urlparse(db_url))
        query = dict(urlparse.parse_qsl(url_parts[4]))
        if 'sslmode' in query:
            del query['sslmode']
        url_parts[4] = urlparse.urlencode(query)
        db_url = urlparse.urlunparse(url_parts)

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-123')

# Robust Engine Options
engine_options = {
    "pool_pre_ping": True,
    "pool_recycle": 300,
}

# Always use SSL context for pg8000 when connecting to Supabase
if "pg8000" in db_url:
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    engine_options["connect_args"] = {"ssl_context": ssl_context, "timeout": 30}

app.config['SQLALCHEMY_ENGINE_OPTIONS'] = engine_options

db = SQLAlchemy(app)

@app.route('/api/health-check', methods=['GET'])
def health_check():
    status = {"status": "online", "db": "unknown", "error": None}
    try:
        # Test DB connection
        with db.engine.connect() as connection:
            connection.execute(text('SELECT 1'))
        status["db"] = "connected"
    except Exception as e:
        status["db"] = "failed"
        status["error"] = str(e)
    return jsonify(status)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True)
    password = db.Column(db.String(120)) 
    profile_pic = db.Column(db.String(200))
    level = db.Column(db.Integer, default=1)
    xp = db.Column(db.Integer, default=0)
    total_focus_hours = db.Column(db.Float, default=0.0)
    daily_stats = db.Column(db.Text, default='{}')
    habits = db.relationship('Habit', backref='user', lazy=True)

    def get_stats(self):
        return json.loads(self.daily_stats or '{}')
    
    def update_stats(self, date_str, hours):
        stats = self.get_stats()
        stats[date_str] = stats.get(date_str, 0) + hours
        self.daily_stats = json.dumps(stats)
        self.total_focus_hours += hours

class Task(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    priority = db.Column(db.String(20), default='normal')
    status = db.Column(db.String(20), default='todo')
    total_hours = db.Column(db.Integer, default=1)
    hours = db.Column(db.Integer, default=0)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

class SubTask(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    task_id = db.Column(db.String(36), db.ForeignKey('task.id'))
    title = db.Column(db.String(200), nullable=False)
    completed = db.Column(db.Boolean, default=False)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text)
    file_url = db.Column(db.String(300))
    sender = db.Column(db.String(80), nullable=False)
    receiver = db.Column(db.String(80), nullable=True) # For private chats
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class Event(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    date = db.Column(db.String(20), nullable=False) # Store as string YYYY-MM-DD
    time = db.Column(db.String(20), nullable=False) # Store as string HH:MM
    category = db.Column(db.String(50))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

class Friendship(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    friend_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    status = db.Column(db.String(20), default='pending') # pending, accepted

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    title = db.Column(db.String(100))
    message = db.Column(db.String(200))
    type = db.Column(db.String(20)) # friend_request, achievement, mission
    read = db.Column(db.Boolean, default=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class Habit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    title = db.Column(db.String(100), nullable=False)
    # Binary string for 7 days: "1011001" (1=done, 0=not)
    weekly_completion = db.Column(db.String(7), default='0000000')
    streak = db.Column(db.Integer, default=0)

# XP Logic
def add_xp(user, amount):
    user.xp += amount
    level_up = False
    required_xp = user.level * 1000 
    if user.xp >= required_xp:
        user.level += 1
        user.xp -= required_xp
        level_up = True
    return level_up

# Initialize database
with app.app_context():
    try:
        db.create_all()
        # Create default user if it doesn't exist
        if not User.query.filter(User.username.ilike('Yuvraj')).first():
            db.session.add(User(username='Yuvraj', daily_stats='{}'))
            db.session.commit()
    except Exception as e:
        print(f"❌ Database initialization error: {e}")

# API Routes

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    if User.query.filter_by(username=username).first():
        return jsonify({'status': 'error', 'message': 'Username already exists'}), 400
    
    user = User(
        username=username,
        email=data.get('email'),
        password=data.get('password'),
        daily_stats='{}'
    )
    try:
        db.session.add(user)
        db.session.commit()
        return jsonify({'status': 'success', 'user': {'username': username}})
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    username_input = data.get('username')
    user = User.query.filter(User.username.ilike(username_input)).first()
    if user and (not user.password or user.password == data.get('password')):
        user_data = {
            'id': user.id,
            'username': user.username,
            'level': user.level,
            'xp': user.xp
        }
        return jsonify({
            'status': 'success',
            'user': user_data
        })
    return jsonify({'status': 'error', 'message': 'Invalid credentials'}), 401

@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    data = request.json
    email = data.get('email')
    username = email.split('@')[0]
    
    user = User.query.filter(User.email.ilike(email)).first()
    if not user:
        user = User(username=username, email=email, daily_stats='{}')
        db.session.add(user)
        db.session.commit()
    
    return jsonify({
        'status': 'success',
        'user': {
            'id': user.id,
            'username': user.username,
            'level': user.level,
            'xp': user.xp
        }
    })

@app.route('/api/user/profile', methods=['GET'])
def get_profile():
    username = request.args.get('username')
    user = User.query.filter(User.username.ilike(username)).first() if username else User.query.first()
    if not user:
         return jsonify({'status': 'error', 'message': 'User not found'}), 404
    return jsonify({
        'username': user.username,
        'level': user.level,
        'xp': user.xp,
        'totalFocusHours': user.total_focus_hours,
        'dailyStats': user.get_stats(),
        'profilePic': user.profile_pic,
        'habitradar': [{'subject': h.title, 'A': (h.weekly_completion.count('1') / 7) * 100} for h in user.habits]
    })

@app.route('/api/user/update', methods=['POST'])
def update_profile():
    data = request.json
    username = data.get('username')
    user = User.query.filter_by(username=username).first()
    if user:
        if 'profilePic' in data: user.profile_pic = data['profilePic']
        db.session.commit()
        return jsonify({'status': 'success'})
    return jsonify({'status': 'error'}), 404

@app.route('/api/users/search', methods=['GET'])
def search_users():
    query = request.args.get('q', '')
    users = User.query.filter(User.username.ilike(f'%{query}%')).limit(10).all()
    return jsonify([{'username': u.username, 'id': u.id} for u in users])

@app.route('/api/friends/add', methods=['POST'])
def add_friend():
    data = request.json
    me = User.query.filter(User.username.ilike(data['me'])).first()
    target = User.query.filter(User.username.ilike(data['target'])).first()
    
    if not target: return jsonify({'status': 'error', 'message': 'User not found'}), 404
    
    notif = Notification(
        user_id=target.id,
        title="Friend Request",
        message=f"{me.username} sent you a friend request!",
        type="friend_request"
    )
    db.session.add(notif)
    db.session.commit()

    socketio.emit('notification', {
        'title': 'Friend Request',
        'message': f"{me.username} sent you a friend request!",
        'target_id': target.id
    })
    return jsonify({'status': 'success'})

@app.route('/api/friends/accept', methods=['POST'])
def accept_friend():
    data = request.json
    me_name = data.get('me')
    sender_name = data.get('sender')
    
    me = User.query.filter(User.username.ilike(me_name)).first()
    sender = User.query.filter(User.username.ilike(sender_name)).first()

    if not me or not sender:
        return jsonify({'status': 'error', 'message': 'User not found'}), 404

    existing = Friendship.query.filter_by(user_id=me.id, friend_id=sender.id).first()
    if not existing:
        f1 = Friendship(user_id=me.id, friend_id=sender.id, status='accepted')
        f2 = Friendship(user_id=sender.id, friend_id=me.id, status='accepted')
        db.session.add(f1)
        db.session.add(f2)
    else:
        existing.status = 'accepted'
        rev_existing = Friendship.query.filter_by(user_id=sender.id, friend_id=me.id).first()
        if rev_existing: rev_existing.status = 'accepted'

    notif = Notification(
        user_id=sender.id,
        title="Request Accepted",
        message=f"{me.username} accepted your friend request!",
        type="info"
    )
    db.session.add(notif)
    db.session.commit()

    socketio.emit('notification', {
        'title': 'Request Accepted',
        'message': f"{me.username} accepted your friend request!",
        'target_id': sender.id
    })
    return jsonify({'status': 'success'})

@app.route('/api/friends', methods=['GET'])
def get_friends():
    username = request.args.get('username')
    user = User.query.filter(User.username.ilike(username)).first()
    if not user: 
        return jsonify([])
    
    friendships = Friendship.query.filter_by(user_id=user.id, status='accepted').all()
    friends = []
    for f in friendships:
        friend = User.query.get(f.friend_id)
        if friend:
            friends.append({
                'id': str(friend.id),
                'name': friend.username,
                'avatar': friend.profile_pic,
                'level': friend.level,
                'status': 'online', 
            })
    return jsonify(friends)

@app.route('/api/notifications', methods=['GET', 'DELETE'])
def handle_notifications():
    username = request.args.get('username')
    user = User.query.filter(User.username.ilike(username)).first()
    if not user: return jsonify([])

    if request.method == 'DELETE':
        notif_id = request.args.get('id')
        notif = Notification.query.filter_by(id=notif_id, user_id=user.id).first()
        if notif:
            db.session.delete(notif)
            db.session.commit()
            return jsonify({'status': 'success'})
        return jsonify({'status': 'error'}), 404

    notifs = Notification.query.filter_by(user_id=user.id).order_by(Notification.timestamp.desc()).all()
    return jsonify([{
        'id': n.id,
        'title': n.title,
        'message': n.message,
        'type': n.type,
        'read': n.read,
        'time': n.timestamp.strftime('%H:%M')
    } for n in notifs])

@app.route('/api/notifications/create', methods=['POST'])
def create_notification():
    data = request.json
    username = data.get('username')
    user = User.query.filter(User.username.ilike(username)).first()
    if not user:
        return jsonify({'status': 'error', 'message': 'User not found'}), 404

    notif = Notification(
        user_id=user.id,
        title=data.get('title'),
        message=data.get('message'),
        type=data.get('type', 'info')
    )
    db.session.add(notif)
    db.session.commit()
    return jsonify({'status': 'success', 'id': notif.id})

@app.route('/api/habits', methods=['GET', 'POST', 'PATCH', 'PUT', 'DELETE'])
def manage_habits():
    data = request.json if request.is_json else {}
    username = request.args.get('username') or data.get('username')
    user = User.query.filter(User.username.ilike(username)).first() if username else None
    if not user: return jsonify({'error': 'User not found'}), 404

    if request.method == 'POST':
        data = request.json
        habit = Habit(user_id=user.id, title=data['title'])
        db.session.add(habit)
        db.session.commit()
        return jsonify({'status': 'success', 'id': habit.id})

    if request.method == 'PATCH':
        data = request.json
        habit = Habit.query.get(data['id'])
        if habit and habit.user_id == user.id:
            habit.weekly_completion = data['completion']
            db.session.commit()
            return jsonify({'status': 'success'})
        return jsonify({'status': 'error'}), 404

    if request.method == 'PUT':
        data = request.json
        habit = Habit.query.get(data['id'])
        if habit and habit.user_id == user.id:
            habit.title = data['title']
            db.session.commit()
            return jsonify({'status': 'success'})
        return jsonify({'error': 'Habit not found'}), 404

    if request.method == 'DELETE':
        habit_id = request.args.get('id')
        habit = Habit.query.get(habit_id)
        if habit and habit.user_id == user.id:
            db.session.delete(habit)
            db.session.commit()
            return jsonify({'status': 'success'})
        return jsonify({'error': 'Habit not found'}), 404

    habits = Habit.query.filter_by(user_id=user.id).all()
    return jsonify([{
        'id': h.id,
        'title': h.title,
        'completion': h.weekly_completion,
        'streak': h.streak
    } for h in habits])

@app.route('/api/focus/track', methods=['POST'])
def track_focus():
    data = request.json
    hours = float(data.get('hours', 0))
    username = data.get('username')
    date_str = datetime.now().strftime('%Y-%m-%d')
    user = User.query.filter(User.username.ilike(username)).first() if username else None
    
    if user:
        try:
            user.update_stats(date_str, hours)
            db.session.commit()
            return jsonify({'status': 'success', 'total': user.total_focus_hours})
        except:
            db.session.rollback()
            return jsonify({'status': 'error', 'message': 'DB Error'}), 500
    return jsonify({'status': 'error', 'message': 'User not found'}), 404

@app.route('/api/tasks', methods=['GET', 'POST'])
def handle_tasks():
    username = request.args.get('username')
    user = User.query.filter(User.username.ilike(username)).first() if username else None
    
    if request.method == 'POST':
        data = request.json
        new_task = Task(
            id=data['id'],
            title=data['title'],
            description=data.get('description', ''),
            priority=data.get('priority', 'normal'),
            total_hours=data.get('totalHours', 1),
            status='todo',
            user_id=user.id if user else None
        )
        try:
            db.session.add(new_task)
            db.session.commit()
            return jsonify({'status': 'success'}), 201
        except:
            db.session.rollback()
            return jsonify({'status': 'error'}), 500
    
    tasks = Task.query.filter_by(user_id=user.id).all() if user else Task.query.all()
    output = []
    for task in tasks:
        subtasks = SubTask.query.filter_by(task_id=task.id).all()
        output.append({
            'id': task.id,
            'title': task.title,
            'description': task.description,
            'priority': task.priority,
            'status': task.status,
            'totalHours': task.total_hours,
            'hours': task.hours,
            'subtasks': [{'id': st.id, 'title': st.title, 'completed': st.completed} for st in subtasks]
        })
    return jsonify(output)

@app.route('/api/tasks/<task_id>', methods=['PATCH'])
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.json
    
    if 'status' in data:
        old_status = task.status
        task.status = data['status']
        if task.status == 'completed' and old_status != 'completed':
            user = User.query.first()
            level_up = add_xp(user, 150)
            db.session.commit()
            
            socketio.emit('xp_gain', {
                'amount': 150,
                'new_xp': user.xp,
                'level': user.level,
                'level_up': level_up
            })
            
            socketio.emit('notification', {
                'title': 'Mission Accomplished!',
                'message': f'You earned 150 XP for completing "{task.title}"',
                'type': 'success'
            })

    if 'subtasks' in data:
        SubTask.query.filter_by(task_id=task_id).delete()
        for st_data in data['subtasks']:
            st = SubTask(id=st_data['id'], task_id=task_id, title=st_data['title'], completed=st_data['completed'])
            db.session.add(st)
    
    db.session.commit()
    return jsonify({'status': 'success'})

@app.route('/api/events', methods=['GET', 'POST', 'DELETE'])
def manage_events():
    username = request.args.get('username')
    user = User.query.filter(User.username.ilike(username)).first()
    if not user: return jsonify([])

    if request.method == 'POST':
        data = request.json
        new_event = Event(
            id=data['id'],
            title=data['title'],
            date=data['date'],
            time=data['time'],
            category=data.get('category', 'general'),
            user_id=user.id
        )
        db.session.add(new_event)
        db.session.commit()
        return jsonify({'status': 'success'})

    if request.method == 'DELETE':
        event_id = request.args.get('id')
        event = Event.query.filter_by(id=event_id, user_id=user.id).first()
        if event:
            db.session.delete(event)
            db.session.commit()
            return jsonify({'status': 'success'})
        return jsonify({'status': 'error'}), 404

    events = Event.query.filter_by(user_id=user.id).all()
    return jsonify([{
        'id': e.id,
        'title': e.title,
        'date': e.date,
        'time': e.time,
        'category': e.category
    } for e in events])

@socketio.on('connect')
def handle_connect():
    print(f"✅ Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    print(f"❌ Client disconnected: {request.sid}")

@socketio.on('message')
def handle_message(data):
    sender = data.get('sender')
    receiver = data.get('receiver')
    text = data.get('text')
    
    if not sender or not text:
        return
    
    msg = Message(text=text, sender=sender, receiver=receiver)
    db.session.add(msg)
    db.session.commit()
    
    message_data = {
        'id': msg.id,
        'text': msg.text,
        'sender': sender,
        'receiver': receiver,
        'timestamp': msg.timestamp.isoformat()
    }
    socketio.emit('new_message', message_data)
    
    if receiver:
        rec_user = User.query.filter(User.username.ilike(receiver)).first()
        if rec_user:
            notif = Notification(
                user_id=rec_user.id,
                title="New Message",
                message=f"You received a new message from {sender}",
                type="message"
            )
            db.session.add(notif)
            db.session.commit()

@app.route('/api/messages', methods=['GET'])
def get_messages():
    user1 = request.args.get('user1')
    user2 = request.args.get('user2')
    
    if not user1 or not user2:
        return jsonify([])
    
    messages = Message.query.filter(
        db.or_(
            db.and_(Message.sender == user1, Message.receiver == user2),
            db.and_(Message.sender == user2, Message.receiver == user1)
        )
    ).order_by(Message.timestamp.asc()).all()
    
    return jsonify([{
        'id': m.id,
        'text': m.text,
        'sender': m.sender,
        'receiver': m.receiver,
        'timestamp': m.timestamp.isoformat()
    } for m in messages])

# Serve Frontend - Catch-all route should be last
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        # Check if index.html exists, if not return a custom message
        if os.path.exists(os.path.join(app.static_folder, 'index.html')):
            return send_from_directory(app.static_folder, 'index.html')
        else:
            return f"Static folder: {app.static_folder} exists: {os.path.exists(app.static_folder)}. index.html not found.", 404

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, debug=True, host='0.0.0.0', port=port)
