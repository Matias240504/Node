const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, allowRoles } = require('../middlewares/authMiddleware');

// Procesar registro
router.post('/registro', userController.register);

// Ruta de login
router.post('/login', userController.login);

// Ruta solo para jueces
router.get('/admin', verifyToken, allowRoles('juez'), (req, res) => {
    res.json({ message: 'Acceso solo para jueces', user: req.user });
});

// Ruta para clientes y abogados
router.get('/dashboard', verifyToken, allowRoles('cliente', 'abogado'), (req, res) => {
    res.json({ message: `Hola ${req.user.usuario}, este es tu dashboard` });
});

module.exports = router;