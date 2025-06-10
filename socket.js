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
        const { username, message, token } = data;
        console.log("Mensaje recibido de:", username);

        // Guardar y emitir mensaje del usuario inmediatamente
        const savedUserMessage = await messageService.createMessage({
          username,
          message,
        });
        io.emit("new-message", savedUserMessage);

        // Indicar que el bot está escribiendo
        io.emit("writing", "Asistente");

        try {
          // Preparar el contexto para la respuesta
          const contextRequest = {
            headers: {
              authorization: `Bearer ${token}`,
            },
            body: {
              message,
            },
          };

          // Obtener mensaje contextualizado
          console.log("Obteniendo contexto del usuario...");
          const contextualMessage = await ollamaService.handleChatRequest(contextRequest);
          console.log("Mensaje contextualizado generado");

          // Iniciar respuesta streaming
          let fullResponse = "";
          let buffer = "";
          let lastEmit = Date.now();
          const EMIT_INTERVAL = 25; // Reducido a 25ms para más fluidez

          console.log("Iniciando streaming de respuesta...");

          // Obtener stream de respuesta usando el método actualizado
          for await (const chunk of ollamaService.streamResponseFromOllama(contextualMessage)) {
            fullResponse += chunk;
            buffer += chunk;

            // Emitir chunks más frecuentemente
            const now = Date.now();
            if (now - lastEmit >= EMIT_INTERVAL) {
              // Enviar el buffer actual
              if (buffer.trim()) {
                io.emit("assistant-stream", {
                  username: "Asistente",
                  message: fullResponse.trim(),
                  isComplete: false
                });
                lastEmit = now;
                buffer = ""; // Limpiar el buffer después de emitir
              }
            }
          }

          // Asegurarse de enviar cualquier contenido restante en el buffer
          if (buffer.trim()) {
            io.emit("assistant-stream", {
              username: "Asistente",
              message: fullResponse.trim(),
              isComplete: false
            });
          }

          // Guardar y emitir mensaje completo
          const savedBotMessage = await messageService.createMessage({
            username: "Asistente",
            message: fullResponse.trim()
          });

          // Emitir mensaje final completo
          io.emit("assistant-stream", {
            username: "Asistente",
            message: fullResponse.trim(),
            isComplete: true
          });

          console.log("Streaming completado");

        } catch (error) {
          console.error("Error al procesar respuesta:", error);
          throw error;
        }
      } catch (error) {
        console.error("Error en el manejo del mensaje:", error);
        const errorMessage = await messageService.createMessage({
          username: "Asistente",
          message: "Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.",
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
