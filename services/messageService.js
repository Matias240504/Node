const Message = require('../models/messageModel');

class MessageService {
    constructor(){}

    async getAllMessages() {
        try {
            const messages = await Message.find({});
            return messages;
        } catch (error) {
            throw new Error('Error fetching messages: ' + error.message);
        }
    }

    async createMessage(msg) {
        try {
            const newMessage = new Message(msg);
            await newMessage.save();
            return newMessage;
        } catch (error) {
            throw new Error('Error creating message: ' + error.message);
        }
    }
}

module.exports = MessageService;