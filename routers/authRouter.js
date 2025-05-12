const express = require('express');
const router = express.Router();
const { iniciarSesion, cerrarSesion } = require('../controllers/authController');

//mostrar vista del login
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

//procesar formulario de login
router.post('/login', iniciarSesion);

//cerrar sesion
router.get('/logout', cerrarSesion);

module.exports = router;