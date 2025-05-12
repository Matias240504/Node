const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRouter = require('./routers/authRouter');

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

//temporal: ruta del dashboard
app.get('/dashboard', (req, res) => {
    res.send('<h2>Bienvenido al sistema legal. Panel en construcción.</h2><a href="/logout">Cerrar sesión</a>');
});

//iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
})