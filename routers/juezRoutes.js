const express = require('express');
const router = express.Router();
const juezController = require('../controllers/juezController');
const { verifyToken, allowRoles } = require('../middlewares/authMiddleware');
const { verifyViewToken, viewAllowRoles } = require('../middlewares/viewAuthMiddleware');

// Dashboard del juez - vista principal (usa middleware de vistas)
router.get('/dashboard', verifyViewToken, viewAllowRoles('juez'), juezController.renderDashboard);

// Selector para elegir usuario y cambiar rol
router.get('/cambiarRol', verifyViewToken, viewAllowRoles('juez'), juezController.renderRoleSelector);

// Formulario de cambio de rol
router.get('/cambiarRol/:id', verifyViewToken, viewAllowRoles('juez'), juezController.renderChangeRoleForm);

// Endpoint para actualizar rol
router.post('/cambiarRol/:id', verifyToken, allowRoles('juez'), juezController.changeUserRole);

// API paginada de usuarios
router.get('/api/usuarios', verifyToken, allowRoles('juez'), juezController.listUsers);

module.exports = router;
