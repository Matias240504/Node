const express = require('express');
const app = express();

const morgan = require('morgan'); // Middleware para registrar las peticiones HTTP en la consola
const userLogin = require('./middlewares/userLogin'); // Middleware para verificar el login del usuario
const path = require('path'); // Módulo para trabajar con rutas de archivos y directorios
const connection = require('./database/connection'); // Conexión a la base de datos MongoDB

//Routers
const personaRouter = require('./routers/personaRouters');
const clienteRouter = require('./routers/clienteRouters');
const abogadoRouter = require('./routers/abogadoRouters');
const casoRouter = require('./routers/casoRouters');

app.use(morgan('dev')); // Usar morgan para registrar las peticiones en la consola
app.use(express.json()); // Middleware para parsear el cuerpo de las peticiones en formato JSON
app.use(userLogin);
app.use(express.static('public')); // Servir archivos estáticos desde la carpeta 'public'

app.set('view engine', 'ejs'); // Establecer el motor de plantillas EJS para renderizar vistas
app.set('views', path.join(__dirname, 'views')); // Establecer la carpeta de vistas

//Rutas
app.get('/', (req, res) => {
    const data = {
        "Title": "Hola mundo",
        "message": "Bienvenido a la aplicación de Express con EJS",
        "showMessage": true,
        "items":[1,2,3,4,5,6,7,8]
    };
    res.render('index', data); // Renderizar la vista 'index.ejs' al acceder a la ruta raíz
})

//Asociar los routers a las rutas correspondientes
app.use('/persona', personaRouter);
app.use('/clientes', clienteRouter);
app.use('/abogado', abogadoRouter);
app.use('/caso', casoRouter);

//levantar el servidor
app.listen(3000, () => {
    console.log('Servidor iniciado con express en el puerto 3000');
})