# app/auth.py

from flask import Blueprint, request, jsonify
from .dependencias import db, bcrypt
from .database import Usuario
from flask_jwt_extended import create_access_token
from datetime import timedelta

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')


# =========================
# REGISTRO DE USUARIO
# =========================
@auth_bp.route('/registro', methods=['POST'])
def registro():
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No se enviaron datos'}), 400

    nombre = data.get('nombre')
    tipo_documento = data.get('tipo_documento')
    numero_documento = data.get('numero_documento')
    telefono = data.get('telefono')
    password = data.get('password')

    # Validación
    if not all([nombre, tipo_documento, numero_documento, telefono, password]):
        return jsonify({'error': 'Faltan campos obligatorios'}), 400

    # Verificar si el usuario ya existe
    usuario_existente = Usuario.query.filter_by(numero_documento=numero_documento).first()
    if usuario_existente:
        return jsonify({'error': 'Usuario ya registrado'}), 409

    # Hashear contraseña
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    # Crear usuario
    nuevo_usuario = Usuario(
        nombre=nombre,
        tipo_documento=tipo_documento,
        numero_documento=numero_documento,
        telefono=telefono,
        password=hashed_password
    )

    try:
        db.session.add(nuevo_usuario)
        db.session.commit()
        return jsonify({'message': 'Usuario registrado correctamente'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Error al registrar usuario', 'detalle': str(e)}), 500


# =========================
# LOGIN
# =========================
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No se enviaron datos'}), 400

    numero_documento = data.get('numero_documento')
    password = data.get('password')

    if not all([numero_documento, password]):
        return jsonify({'error': 'Faltan campos'}), 400

    usuario = Usuario.query.filter_by(numero_documento=numero_documento).first()

    # Validación segura
    if not usuario or not bcrypt.check_password_hash(usuario.password, password):
        return jsonify({'error': 'Credenciales inválidas'}), 401

    # Token JWT (1 día)
    access_token = create_access_token(
        identity=usuario.id,
        expires_delta=timedelta(days=1)
    )

    return jsonify({
        'message': 'Login exitoso',
        'token': access_token
    }), 200


# =========================
# RECUPERACIÓN DE CONTRASEÑA
# =========================
@auth_bp.route('/recuperar-password', methods=['POST'])
def recuperar_password():
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No se enviaron datos'}), 400

    numero_documento = data.get('numero_documento')
    nueva_password = data.get('nueva_password')

    if not all([numero_documento, nueva_password]):
        return jsonify({'error': 'Faltan campos'}), 400

    usuario = Usuario.query.filter_by(numero_documento=numero_documento).first()

    if not usuario:
        return jsonify({'error': 'Usuario no encontrado'}), 404

    try:
        # Actualizar contraseña
        usuario.password = bcrypt.generate_password_hash(nueva_password).decode('utf-8')
        db.session.commit()

        return jsonify({'message': 'Contraseña actualizada correctamente'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Error al actualizar contraseña', 'detalle': str(e)}), 500