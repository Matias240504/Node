const express = require('express');
const router = express.Router();
const casoController = require('../controllers/casoController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de multer para la carga de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Crear directorio si no existe
        const uploadDir = path.join(__dirname, '../uploads/casos');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generar nombre único para el archivo
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'caso-' + uniqueSuffix + ext);
    }
});

// Filtro para tipos de archivos permitidos
const fileFilter = (req, file, cb) => {
    // Tipos MIME permitidos
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/jpg'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo se permiten PDF, DOC, DOCX, JPG y PNG.'), false);
    }
};

// Configuración de multer
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // Límite de 10MB por archivo
    }
});

// Rutas para casos
// Crear un nuevo caso (requiere autenticación y rol de cliente)
router.post('/crear', 
    authMiddleware.verifyToken, 
    authMiddleware.isCliente, 
    upload.array('files', 5), // Máximo 5 archivos
    casoController.crearCaso
);

// Obtener todos los casos de un cliente
router.get('/cliente', 
    authMiddleware.verifyToken, 
    authMiddleware.isCliente, 
    casoController.obtenerCasosCliente
);

// Obtener un caso específico por ID
router.get('/:id', 
    authMiddleware.verifyToken, 
    casoController.obtenerCasoPorId
);

// Obtener estadísticas de casos para el dashboard
router.get('/estadisticas/cliente', 
    authMiddleware.verifyToken, 
    authMiddleware.isCliente, 
    casoController.obtenerEstadisticasCasos
);

module.exports = router;
