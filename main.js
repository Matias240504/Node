const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken'); // Importar JWT
const userRoutes = require('./routers/userRouter');
const casoRoutes = require('./routers/casoRoutes');
const abogadoRoutes = require('./routers/abogadoRoutes'); // Importar nuevas rutas para abogado
const juezRoutes = require('./routers/juezRoutes'); // Importar rutas para juez
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const { verifyViewToken, viewAllowRoles } = require('./middlewares/viewAuthMiddleware');
const multer = require('multer');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware globales
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Para manejar cookies

// Middleware para manejar errores de multer
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'El archivo es demasiado grande. Máximo 10MB.' });
        }
        return res.status(400).json({ message: `Error en la carga de archivos: ${err.message}` });
    } else if (err) {
        return res.status(500).json({ message: err.message });
    }
    next();
});

// Rutas
app.use('/api/users', userRoutes);
app.use('/api/casos', casoRoutes);
app.use('/abogado', abogadoRoutes); // Añadir rutas de abogado
app.use('/juez', juezRoutes); // Usar las rutas de juez

// Ruta específica para obtener datos de un abogado (para el cliente)
const { verifyToken, allowRoles } = require('./middlewares/authMiddleware');
const abogadoController = require('./controllers/abogadoController');
app.get('/api/abogados/:id', verifyToken, allowRoles('cliente', 'abogado'), abogadoController.obtenerAbogadoPorId);

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log('Conectado a MongoDB');
    
    // Crear servidor HTTP y configurar Socket.io
    const server = http.createServer(app);
    const io = socketIo(server);
    
    // Configurar Socket.io
    require('./socket')(io);
    
    server.listen(PORT, () => {
        console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
})
.catch((err) => {
    console.error('Error de conexión a MongoDB:', err.message);
});

// Redirección directa a login y registro desde navegador
app.get('/auth/login', (req, res) => {
    res.render('auth/login');
});

app.get('/', (req, res) => {
    // Simplemente mostrar la página de inicio sin redireccionamiento
    console.log('Ruta raíz solicitada - Mostrando página de inicio sin redirecciones');
    return res.render('index');
});

app.get('/auth/register', (req, res) => {
    res.render('auth/register');
});

// Rutas protegidas para dashboards
app.get('/cliente/dashboard', verifyViewToken, viewAllowRoles('cliente'), (req, res) => {
    res.render('cliente/dashboard', { user: req.user });
});

app.get('/cliente/crearCaso', verifyViewToken, viewAllowRoles('cliente'), (req, res) => {
    res.render('cliente/crearCaso', { user: req.user });
});

app.get('/cliente/visualizacion-casos', verifyViewToken, viewAllowRoles('cliente'), (req, res) => {
    res.render('cliente/visualizacion-casos', { 
        user: req.user,
        currentPath: '/cliente/visualizacion-casos'
    });
});

app.get('/cliente/caso/:id', verifyViewToken, viewAllowRoles('cliente'), async (req, res) => {
    try {
        const casoId = req.params.id;
        const clienteId = req.user.id;
        
        // Importar el modelo de Caso
        const Caso = require('./models/caso');
        
        // Buscar el caso asegurándose que pertenezca al cliente actual
        const caso = await Caso.findOne({ _id: casoId, clienteId })
            .populate('abogadoId', 'nombre apellido')
            .populate('juezId', 'nombre apellido')
            .populate('comentarios.autor', 'nombre apellido rol');
            
        if (!caso) {
            return res.status(404).render('error', { 
                message: 'Caso no encontrado o no tienes permisos para verlo',
                error: { status: 404 }
            });
        }
        
        res.render('cliente/detalle-caso', {
            user: req.user,
            caso,
            currentPath: '/cliente/visualizacion-casos'
        });
    } catch (error) {
        console.error('Error al obtener detalles del caso:', error);
        res.status(500).render('error', { 
            message: 'Error al cargar los detalles del caso',
            error: { status: 500 }
        });
    }
});

app.get('/chat', (req, res) => {
    res.render('cliente/chatBot');
});

// La ruta /abogado/dashboard ahora es manejada por el controlador en abogadoRoutes.js

// La ruta /juez/dashboard ahora es manejada por el controlador en juezRoutes.js
