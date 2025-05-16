const Message = require('../models/messageModel');

class MessageService {
    /**
     * Obtener todos los mensajes
     * @returns {Promise<Array>} Lista de mensajes
     */
    async getAllMessages() {
        try {
            // Obtener todos los mensajes ordenados por fecha de creación (implícita en _id)
            // Limitar a los últimos 50 mensajes para evitar sobrecarga
            const messages = await Message.find().sort({ _id: -1 }).limit(50).lean();
            return messages.reverse(); // Invertir para mostrar los más antiguos primero
        } catch (error) {
            console.error('Error al obtener mensajes:', error);
            return [];
        }
    }

    /**
     * Crear un nuevo mensaje
     * @param {Object} messageData Datos del mensaje (username, message)
     * @returns {Promise<Object>} Mensaje creado
     */
    async createMessage(messageData) {
        try {
            const newMessage = new Message({
                username: messageData.username,
                message: messageData.message
            });
            await newMessage.save();
            return newMessage;
        } catch (error) {
            console.error('Error al crear mensaje:', error);
            throw error;
        }
    }
}

module.exports = MessageService;
