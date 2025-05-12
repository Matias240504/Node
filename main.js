const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');
const userRouter = require('./routers/userRouter');

const authRouter = require('./routers/authRouter');
const verificarToken = require('./middlewares/authMiddleware');

const app = express();
const PORT = 3000;

//configuracion
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public/css')));

//rutas
app.use('/', authRouter);
app.use('/user', userRouter);

//ruta del dashboard
app.get('/dashboard', verificarToken, (req, res) => {
    res.send(`
    <h2>Bienvenido, ${req.usuario.nombre} (${req.usuario.rol})</h2>
    <p>Acceso autorizado al panel legal.</p>
    <a href="/logout">Cerrar sesión</a>
    `);
});

//iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
})