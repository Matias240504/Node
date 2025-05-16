const MessageService = require('./services/messageService'); // Importar el servicio de mensajes
const messageService = new MessageService(); // Crear una instancia del servicio de mensajes

module.exports = (io) => {
    //let message = [{username: 'Fake-user', message: 'Hola, soy un mensaje de prueba'}]; // Array para almacenar los mensajes
    io.on('connection', async (socket) => { // Evento de conexión de Socket.IO
        console.log('Nuevo cliente conectado'); // Mensaje en la consola al conectar un nuevo cliente
        const message = await messageService.getAllMessages(); // Obtener todos los mensajes de la base de datos
        io.emit('all-messages', message); // Enviar los mensajes actuales al nuevo cliente

        socket.on('writing', (username) => { // Evento cuando un cliente está escribiendo
            socket.broadcast.emit('writing', username); // Emitir el evento a todos los demás clientes
        });

        socket.on('new-message', async (data) => { // Evento cuando se recibe un nuevo mensaje
            await messageService.createMessage(data); // Guardar el nuevo mensaje en la base de datos
            const message = await messageService.getAllMessages(); // Obtener todos los mensajes actualizados
            io.emit('all-messages', message); // Enviar todos los mensajes a todos los clientes
        });
    });
}