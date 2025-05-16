const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userRoutes = require('./routers/userRouter');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const { verifyViewToken, viewAllowRoles } = require('./middlewares/viewAuthMiddleware');

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
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Para manejar cookies

// Rutas
app.use('/api/users', userRoutes);

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log('Conectado a MongoDB');
    app.listen(PORT, () => {
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
    res.render('index');
});

app.get('/auth/register', (req, res) => {
    res.render('auth/register');
});

// Rutas protegidas para dashboards
app.get('/cliente/dashboard', verifyViewToken, viewAllowRoles('cliente'), (req, res) => {
    res.render('auth/cliente/dashboard', { user: req.user });
});

app.get('/abogado/dashboard', verifyViewToken, viewAllowRoles('abogado'), (req, res) => {
    res.render('auth/abogado/dashboard', { user: req.user });
});

app.get('/juez/dashboard', verifyViewToken, viewAllowRoles('juez'), (req, res) => {
    res.render('auth/juez/dashboard', { user: req.user });
});
