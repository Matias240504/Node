const MessageService = require("./services/messageService");
const OllamaService = require("./services/ollamaService");
const messageService = new MessageService();
const ollamaService = new OllamaService();

module.exports = (io) => {
  io.on("connection", async (socket) => {
    console.log("Nuevo cliente conectado");

    try {
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
        io.emit("new-message", savedUserMessage);

        // Indicar que el bot está escribiendo
        io.emit("writing", "Asistente");

        // Iniciar respuesta streaming
        let fullResponse = "";
        let lastEmit = Date.now();
        const EMIT_INTERVAL = 100; // Emitir cada 100ms

        for await (const chunk of ollamaService.streamResponseFromOllama(message)) {
          fullResponse += chunk;

          // Emitir chunks periódicamente para una experiencia fluida
          const now = Date.now();
          if (now - lastEmit >= EMIT_INTERVAL) {
            io.emit("assistant-stream", {
              username: "Asistente",
              message: fullResponse.trim(),
              isComplete: false,
            });
            lastEmit = now;
          }
        }

        // Guardar y emitir mensaje completo
        const savedBotMessage = await messageService.createMessage({
          username: "Asistente",
          message: fullResponse.trim(),
        });

        io.emit("assistant-stream", {
          username: "Asistente",
          message: fullResponse.trim(),
          isComplete: true,
        });
      } catch (error) {
        console.error("Error en el manejo del mensaje:", error);
        const errorMessage = await messageService.createMessage({
          username: "Asistente",
          message:
            "Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.",
        });
        io.emit("new-message", errorMessage);
        socket.emit("error", {
          message: "Error al procesar el mensaje",
          details: error.message,
        });
      }
    });
  });
};
