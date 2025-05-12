const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
require('dotenv').config();

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log('Auth Header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token recibido:', token);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.findById(decoded.id).select('-contrasena');
        console.log('Token decodificado:', decoded);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        req.user = user; // Se guarda el usuario en la request
        next();
    } catch (error) {
        console.error('Error al verificar token:', error.message);
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

const allowRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({ message: 'Acceso denegado: rol no autorizado' });
        }
        next();
    };
};

module.exports = { verifyToken, allowRoles };