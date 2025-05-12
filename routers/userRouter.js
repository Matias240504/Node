const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Mostrar formulario de registro
router.get('/registro', userController.mostrarFormularioRegistro);

// Procesar registro
router.post('/registro', userController.registrarUsuario);
