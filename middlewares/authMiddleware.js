const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
require('dotenv').config();

const verifyToken = async (req, res, next) => {
    // Obtener token de múltiples fuentes: cookies, query string, o headers
    const authHeader = req.headers.authorization;
    console.log('Auth Header:', authHeader);
    
    // Intentar obtener el token de varias fuentes
    const token = req.cookies?.token || 
                 req.query.token || 
                 (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);
                 
    console.log('Token recibido:', token ? 'Token presente' : 'Token ausente');
    
    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

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

// Middleware específico para verificar si el usuario es cliente
const isCliente = (req, res, next) => {
    if (req.user.rol !== 'cliente') {
        return res.status(403).json({ message: 'Acceso denegado: se requiere rol de cliente' });
    }
    next();
};

// Middleware específico para verificar si el usuario es abogado
const isAbogado = (req, res, next) => {
    if (req.user.rol !== 'abogado') {
        return res.status(403).json({ message: 'Acceso denegado: se requiere rol de abogado' });
    }
    next();
};

// Middleware específico para verificar si el usuario es juez
const isJuez = (req, res, next) => {
    if (req.user.rol !== 'juez') {
        return res.status(403).json({ message: 'Acceso denegado: se requiere rol de juez' });
    }
    next();
};

module.exports = { verifyToken, allowRoles, isCliente, isAbogado, isJuez };