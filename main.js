const express = require('express');
const app = express();
const userRouter = require('./routers/userRouters');
const morgan = require('morgan'); // Middleware para registrar las peticiones HTTP en la consola
const userLogin = require('./middlewares/userLogin'); // Middleware para verificar el login del usuario
const path = require('path'); // Módulo para trabajar con rutas de archivos y directorios
const connection = require('./database/connection'); // Conexión a la base de datos MongoDB
const socket = require('socket.io'); // Módulo para trabajar con WebSockets

app.use(morgan('dev')); // Usar morgan para registrar las peticiones en la consola
app.use(express.json()); // Middleware para parsear el cuerpo de las peticiones en formato JSON
//app.use(userLogin);
app.use(express.static('public')); // Servir archivos estáticos desde la carpeta 'public'
app.set('view engine', 'ejs'); // Establecer el motor de plantillas EJS para renderizar vistas
app.set('views', path.join(__dirname, 'views')); // Establecer la carpeta de vistas

app.get('/', (req, res) => {
    res.render('index'); // Renderizar la vista 'index.ejs' al acceder a la ruta raíz
})

//app.use('/user', userRouter);

const server = require('http').createServer(app); // Crear un servidor HTTP con Express
const io = socket(server); // Crear una instancia de Socket.IO con el servidor HTTP
require('./socket')(io); // Importar el archivo socket.js y pasarle la instancia de Socket.IO

server.listen(3000, () => {
    console.log('Servidor iniciado con express en el puerto 3000');
})