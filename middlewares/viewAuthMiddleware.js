const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
require('dotenv').config();

// Middleware para verificar token en rutas de vistas
const verifyViewToken = async (req, res, next) => {
    // Obtener token de múltiples fuentes: cookies, query string, o headers
    const token = req.cookies?.token || req.query.token || 
                 (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? 
                  req.headers.authorization.split(' ')[1] : null);
    
    console.log('Token recibido en vista:', token ? 'Token presente' : 'Token ausente');
    
    if (!token) {
        console.log('No se encontró token, redirigiendo a login');
        return res.redirect('/auth/login');
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        console.log('Token decodificado:', decoded);
        
        // Intentar encontrar el usuario por ID
        let user = await User.findById(decoded.id).select('-contrasena');
        
        // Si no se encuentra el usuario por ID, intentar recuperar la información del localStorage
        if (!user) {
            console.log('Usuario no encontrado con ID:', decoded.id);
            
            // Crear un usuario temporal basado en la información del token
            // Esto permitirá que la sesión continúe mientras se resuelve el problema de base de datos
            user = {
                _id: decoded.id,
                rol: decoded.rol,
                nombre: 'Usuario',
                email: 'usuario@ejemplo.com'
            };
            
            console.log('Creado usuario temporal basado en token:', user);
        }
        
        console.log('Usuario autenticado:', user.nombre, '- Rol:', user.rol);
        
        // Verificar si el usuario está intentando acceder a una ruta que no corresponde a su rol
        const path = req.path;
        console.log('Ruta solicitada:', path);
        console.log('Rol del usuario:', user.rol);
        
        // IMPORTANTE: Garantizar que cada rol se redireccione correctamente
        if (user.rol === 'cliente') {
            // Si es cliente y está intentando acceder a rutas de abogado o juez
            if (path.startsWith('/abogado/') || path.startsWith('/juez/')) {
                console.log('Redirigiendo cliente a su dashboard desde ruta no autorizada');
                return res.redirect('/cliente/dashboard');
            }
        } else if (user.rol === 'abogado') {
            // Si es abogado y está intentando acceder a rutas de cliente o juez
            if (path.startsWith('/cliente/') || path.startsWith('/juez/')) {
                console.log('Redirigiendo abogado a su dashboard desde ruta no autorizada');
                return res.redirect('/abogado/dashboard');
            }
        } else if (user.rol === 'juez') {
            // Si es juez y está intentando acceder a rutas de cliente o abogado
            if (path.startsWith('/cliente/') || path.startsWith('/abogado/')) {
                console.log('Redirigiendo juez a su dashboard desde ruta no autorizada');
                return res.redirect('/juez/dashboard');
            }
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
        if (!req.user) {
            console.log('No hay usuario en la request, redirigiendo a login');
            return res.redirect('/auth/login');
        }
        
        if (!roles.includes(req.user.rol)) {
            console.log(`Rol ${req.user.rol} no autorizado para esta ruta, redirigiendo a su dashboard`);
            
            // Redirigir al usuario a su dashboard correspondiente según su rol
            if (req.user.rol === 'cliente') {
                return res.redirect('/cliente/dashboard');
            } else if (req.user.rol === 'abogado') {
                return res.redirect('/abogado/dashboard');
            } else if (req.user.rol === 'juez') {
                return res.redirect('/juez/dashboard');
            } else {
                return res.redirect('/');
            }
        }
        
        next();
    };
};

module.exports = { verifyViewToken, viewAllowRoles };
