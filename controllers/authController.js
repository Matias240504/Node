const Persona = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config');

const iniciarSesion = async (req, res) => {
    const { usuario, password } = req.body;

    try {
        const persona = await Persona.findOne({ usuario });
        if (!persona) {
            return res.status(401).render('login', {error: 'Usuario no encontrado'});
        }

        const  passwordValida = await bcrypt.compare(constrasena, persona.constrasena);

        if (!passwordValida) {
            return res.status(401).render('login', {error: 'Contraseña incorrecta'});
        }

        const token = jwt.sign(
            { id: persona._id, rol:persona.rol, nombre: persona.nombre },
            jwtSecret,
            { expiresIn: jwtExpiresIn }
        );

        res.cookie('token', token, { httpOnly: true});
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error al iniciar sesión:', error.message);
        res.status(500).render('login', {error: 'Error interno del servidor'});
    }
};

const cerrarSesion = (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
}

module.exports = { iniciarSesion, cerrarSesion };