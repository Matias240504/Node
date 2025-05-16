const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
require('dotenv').config();

// Middleware para verificar token en rutas de vistas
const verifyViewToken = async (req, res, next) => {
    // Obtener token de las cookies (si está implementado) o de la query string
    const token = req.cookies?.token || req.query.token;
    
    if (!token) {
        return res.redirect('/auth/login');
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.findById(decoded.id).select('-contrasena');
        
        if (!user) {
            return res.redirect('/auth/login');
        }
        
        // Guardar el usuario en la request para uso en las vistas
        req.user = user;
        // Pasar datos del usuario a las vistas
        res.locals.user = user;
        next();
    } catch (error) {
        console.error('Error al verificar token de vista:', error.message);
        return res.redirect('/auth/login');
    }
};

// Middleware para verificar roles en rutas de vistas
const viewAllowRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.rol)) {
            return res.redirect('/');
        }
        next();
    };
};

module.exports = { verifyViewToken, viewAllowRoles };
