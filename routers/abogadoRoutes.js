const express = require('express');
const router = express.Router();
const abogadoController = require('../controllers/abogadoController');
const { verifyToken, allowRoles } = require('../middlewares/authMiddleware');
const { verifyViewToken, viewAllowRoles } = require('../middlewares/viewAuthMiddleware');

// No usar middleware global para permitir diferenciar entre rutas de vista y API

// Dashboard del abogado - vista principal (usa middleware de vistas)
router.get('/dashboard', verifyViewToken, viewAllowRoles('abogado'), abogadoController.renderDashboard);

// API para obtener casos del abogado (sin paginación, para el dashboard)
router.get('/api/casos', verifyToken, allowRoles('abogado'), abogadoController.obtenerCasosAbogado);

// API para obtener casos del abogado con paginación (para la vista de casos)
router.get('/api/casos-paginados', verifyToken, allowRoles('abogado'), abogadoController.obtenerCasosConPaginacion);

// API para obtener estadísticas
router.get('/api/estadisticas', verifyToken, allowRoles('abogado'), abogadoController.obtenerEstadisticasAbogado);

// API para obtener audiencias con paginación
router.get('/api/audiencias', verifyToken, allowRoles('abogado'), abogadoController.obtenerAudiencias);

// Ruta para la vista de audiencias
router.get('/audiencias', verifyViewToken, viewAllowRoles('abogado'), abogadoController.renderAudiencias);

// Rutas para crear audiencias
router.get('/crearAudiencia', verifyViewToken, viewAllowRoles('abogado'), abogadoController.renderCrearAudiencia);
router.get('/api/salas-disponibles', verifyToken, allowRoles('abogado'), abogadoController.obtenerSalasDisponibles);
router.get('/api/casos-aceptados', verifyToken, allowRoles('abogado'), abogadoController.obtenerCasosAceptados);
router.post('/api/audiencias', verifyToken, allowRoles('abogado'), abogadoController.crearAudiencia);

// Rutas para casos
router.get('/casos', verifyViewToken, viewAllowRoles('abogado'), abogadoController.renderCasos);
router.get('/casos/:id', verifyViewToken, viewAllowRoles('abogado'), abogadoController.renderDetalleCaso);

// API para detalles, notas y estado de casos
router.get('/api/casos/:id', verifyToken, allowRoles('abogado'), abogadoController.obtenerDetalleCaso);
router.post('/api/casos/:id/nota', verifyToken, allowRoles('abogado'), abogadoController.agregarNotaCaso);
router.put('/api/casos/:id/estado', verifyToken, allowRoles('abogado'), abogadoController.actualizarEstadoCaso);

// Rutas para mis datos
router.get('/mis-datos', verifyViewToken, viewAllowRoles('abogado'), abogadoController.renderMisDatos);
router.put('/api/actualizar-datos', verifyToken, allowRoles('abogado'), abogadoController.actualizarDatosAbogado);

module.exports = router;
