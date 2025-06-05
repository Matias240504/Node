const MessageService = require("./services/messageService");
const OllamaService = require("./services/ollamaService");
const messageService = new MessageService();
const ollamaService = new OllamaService();

module.exports = (io) => {
  io.on("connection", async (socket) => {
    console.log("Nuevo cliente conectado XDXDXDX");

    try {
      // Enviar mensajes guardados al cliente nuevo
      const messages = await messageService.getAllMessages();
      socket.emit("all-messages", messages);
    } catch (error) {
      console.error("Error al cargar mensajes:", error);
    }

    socket.on("new-message", async (data) => {
      try {
        const { username, message } = data;
        console.log("Mensaje recibido:", { username, message });

        // Guardar y emitir mensaje del usuario inmediatamente
        const savedUserMessage = await messageService.createMessage({
          username,
          message,
        });
        console.log("Mensaje de usuario guardado:", savedUserMessage);
        io.emit("new-message", savedUserMessage);

        // Indicar que el bot está escribiendo
        io.emit("writing", "Asistente");

        // Obtener y procesar respuesta del bot
        console.log("Solicitando respuesta a Ollama...");
        const botReply = await ollamaService.getResponseFromOllama(message);
        console.log("Respuesta de Ollama recibida:", botReply);

        if (botReply && botReply.trim()) {
          // Pequeña pausa para simular el tiempo de escritura
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Guardar y emitir respuesta del bot
          const savedBotMessage = await messageService.createMessage({
            username: "Asistente",
            message: botReply.trim(),
          });
          console.log("Mensaje del bot guardado:", savedBotMessage);
          io.emit("new-message", savedBotMessage);
        } else {
          // Enviar mensaje de error si la respuesta está vacía
          const errorMessage = await messageService.createMessage({
            username: "Asistente",
            message:
              "Lo siento, no pude generar una respuesta en este momento.",
          });
          io.emit("new-message", errorMessage);
        }
      } catch (error) {
        console.error("Error en el manejo del mensaje:", error);

        // Enviar mensaje de error al chat
        const errorMessage = await messageService.createMessage({
          username: "Asistente",
          message:
            "Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.",
        });
        io.emit("new-message", errorMessage);

        // Emitir evento de error para manejo adicional si es necesario
        socket.emit("error", {
          message: "Error al procesar el mensaje",
          details: error.message,
        });
      }
    });
  });
};
