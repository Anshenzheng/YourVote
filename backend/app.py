import os
import uuid
import base64
from io import BytesIO
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit, join_room, leave_room
import qrcode
from qrcode.image.pil import PilImage

app = Flask(__name__)
app.config['SECRET_KEY'] = 'yourvote-secret-key-2024'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///yourvote.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'

CORS(app, resources={r"/api/*": {"origins": "*"}})
db = SQLAlchemy(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)


class Room(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(20), default='vote')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    options = db.relationship('Option', backref='room', lazy=True, cascade='all, delete-orphan')
    votes = db.relationship('Vote', backref='room', lazy=True, cascade='all, delete-orphan')


class Option(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    room_id = db.Column(db.String(36), db.ForeignKey('room.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    image = db.Column(db.Text, nullable=True)
    votes_count = db.Column(db.Integer, default=0)


class Vote(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    room_id = db.Column(db.String(36), db.ForeignKey('room.id'), nullable=False)
    option_id = db.Column(db.String(36), db.ForeignKey('option.id'), nullable=False)
    voter_identifier = db.Column(db.String(100), nullable=False)
    voted_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (db.UniqueConstraint('room_id', 'voter_identifier'),)


with app.app_context():
    db.create_all()


@app.route('/api/rooms', methods=['POST'])
def create_room():
    data = request.json
    room = Room(
        name=data['name'],
        type=data.get('type', 'vote')
    )
    db.session.add(room)
    db.session.flush()
    
    for opt in data.get('options', []):
        option = Option(
            room_id=room.id,
            name=opt['name'],
            image=opt.get('image')
        )
        db.session.add(option)
    
    db.session.commit()
    
    return jsonify({
        'id': room.id,
        'name': room.name,
        'type': room.type,
        'options': [{
            'id': o.id,
            'name': o.name,
            'image': o.image,
            'votes_count': o.votes_count
        } for o in room.options]
    }), 201


@app.route('/api/rooms/<room_id>', methods=['GET'])
def get_room(room_id):
    room = Room.query.get_or_404(room_id)
    total_votes = sum(o.votes_count for o in room.options)
    
    return jsonify({
        'id': room.id,
        'name': room.name,
        'type': room.type,
        'is_active': room.is_active,
        'total_votes': total_votes,
        'options': [{
            'id': o.id,
            'name': o.name,
            'image': o.image,
            'votes_count': o.votes_count,
            'percentage': round((o.votes_count / total_votes * 100), 1) if total_votes > 0 else 0
        } for o in room.options]
    })


@app.route('/api/rooms/<room_id>/vote', methods=['POST'])
def vote(room_id):
    room = Room.query.get_or_404(room_id)
    if not room.is_active:
        return jsonify({'error': '投票已结束'}), 400
    
    data = request.json
    option_id = data.get('option_id')
    voter_identifier = data.get('voter_identifier')
    
    if not voter_identifier:
        voter_identifier = request.remote_addr + request.headers.get('User-Agent', '')[:100]
    
    existing_vote = Vote.query.filter_by(room_id=room_id, voter_identifier=voter_identifier).first()
    if existing_vote:
        return jsonify({'error': '您已投过票', 'already_voted': True}), 400
    
    option = Option.query.filter_by(id=option_id, room_id=room_id).first()
    if not option:
        return jsonify({'error': '无效的选项'}), 404
    
    vote = Vote(
        room_id=room_id,
        option_id=option_id,
        voter_identifier=voter_identifier
    )
    option.votes_count += 1
    
    db.session.add(vote)
    db.session.commit()
    
    total_votes = sum(o.votes_count for o in room.options)
    vote_data = {
        'room_id': room.id,
        'total_votes': total_votes,
        'options': [{
            'id': o.id,
            'name': o.name,
            'votes_count': o.votes_count,
            'percentage': round((o.votes_count / total_votes * 100), 1) if total_votes > 0 else 0
        } for o in room.options]
    }
    
    socketio.emit('vote_update', vote_data, room=room_id)
    
    return jsonify({
        'success': True,
        'voted_option': option.name,
        'votes_count': option.votes_count
    })


@app.route('/api/rooms/<room_id>/qrcode', methods=['GET'])
def generate_qrcode(room_id):
    room = Room.query.get_or_404(room_id)
    
    base_url = request.host_url.rstrip('/')
    voter_url = f"{base_url}/vote/{room_id}"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(voter_url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return jsonify({
        'qrcode_base64': f"data:image/png;base64,{img_str}",
        'voter_url': voter_url,
        'display_url': f"{base_url}/display/{room_id}"
    })


@app.route('/api/rooms/<room_id>/toggle', methods=['POST'])
def toggle_room(room_id):
    room = Room.query.get_or_404(room_id)
    data = request.json
    room.is_active = data.get('is_active', not room.is_active)
    db.session.commit()
    return jsonify({'is_active': room.is_active})


@app.route('/api/rooms', methods=['GET'])
def list_rooms():
    rooms = Room.query.order_by(Room.created_at.desc()).all()
    return jsonify([{
        'id': r.id,
        'name': r.name,
        'type': r.type,
        'is_active': r.is_active,
        'created_at': r.created_at.isoformat()
    } for r in rooms])


@socketio.on('join')
def on_join(data):
    room_id = data.get('room_id')
    join_room(room_id)
    
    room = Room.query.get(room_id)
    if room:
        total_votes = sum(o.votes_count for o in room.options)
        emit('vote_update', {
            'room_id': room.id,
            'total_votes': total_votes,
            'options': [{
                'id': o.id,
                'name': o.name,
                'votes_count': o.votes_count,
                'percentage': round((o.votes_count / total_votes * 100), 1) if total_votes > 0 else 0
            } for o in room.options]
        }, room=request.sid)


@socketio.on('leave')
def on_leave(data):
    room_id = data.get('room_id')
    leave_room(room_id)


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
