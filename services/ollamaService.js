require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Caso = require('../models/caso');

class OllamaService {
  constructor() {
    this.apiUrl = "http://localhost:11434/api/generate";
    this.model = "gemma3";
  }

  async getResponseFromOllama(userMessage) {
    try {
      const requestBody = {
        model: this.model,
        prompt: userMessage,
        stream: false,
        temperature: 0.7,
        max_tokens: 500,
      };

      console.log("Enviando solicitud a Ollama:", {
        url: this.apiUrl,
        body: requestBody,
      });

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Error en la respuesta de Ollama:",
          response.status,
          response.statusText,
          errorText
        );
        throw new Error(
          `Estado HTTP no esperado: ${response.status}. Detalles: ${errorText}`
        );
      }

      const data = await response.json();
      console.log("Respuesta recibida de Ollama:", {
        status: response.status,
        data: data
      });
      
      return data.response;
    } catch (error) {
      console.error("Error al obtener respuesta de Ollama:", error);
      throw error;
    }
  }

  async handleChatRequest(req) {
    try {
      // 1. Verificar y decodificar el token JWT
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Token no proporcionado');
        return req.body.message;
      }      const token = authHeader.split(' ')[1];      if (!process.env.JWT_SECRET_KEY) {
        console.error('JWT_SECRET_KEY no está definido en las variables de entorno');
        return req.body.message;
      }

      try {        console.log('Intentando verificar token JWT...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        console.log('Token verificado:', decoded);
        
        // El id del usuario puede estar en decoded.id o decoded.userId
        const userId = decoded.id || decoded.userId;
        if (!userId) {
          console.error('No se encontró el ID del usuario en el token:', decoded);
          return req.body.message;
        }
        console.log('ID de usuario encontrado:', userId);
            // 2. Obtener datos del usuario
      const user = await User.findById(userId)
        .select('nombre apellido email rol')
        .lean();
      
      console.log('Usuario encontrado:', user ? 'Sí' : 'No');

        if (!user) {
          console.log('Usuario no encontrado, procesando mensaje sin contexto');
          return req.body.message;
        }

        // 3. Si es cliente, obtener sus casos
        let casos = [];
        if (user.rol === 'cliente') {
          casos = await Caso.find({ clienteId: user._id })
            .select('titulo tipo estado descripcion numeroExpediente')
            .populate('abogadoId', 'nombre apellido')
            .lean();
        }

        // 4. Generar prompt contextual
        const contextPrompt = this.generateContextualPrompt(user, casos, req.body.message);
        return contextPrompt;

      } catch (error) {
        console.log('Error al verificar token o obtener datos:', error);
        return req.body.message;
      }

    } catch (error) {
      console.error('Error en handleChatRequest:', error);
      return req.body.message;
    }
  }

  generateContextualPrompt(user, casos, userMessage) {
    // Detectar saludos simples para evitar añadir contexto innecesario
    const greetingRegex = /^(hola|hello|hi|buenos dias|buenas tardes|buenas noches)[!.¡¿,\s]*$/i;
    if (greetingRegex.test(userMessage.trim())) {
      // Respuesta corta y cordial sin incluir casos del cliente
      return `Eres un asistente legal profesional. El usuario te ha saludado con "${userMessage}". Responde de forma cordial y breve, sin añadir información no solicitada.`;
    }

    let contextPrompt = `Como asistente legal, estás hablando con ${user.nombre} ${user.apellido} (${user.rol}).`;

    if (user.rol === 'cliente') {
      contextPrompt += '\n\nInformación de sus casos:';
      
      if (casos.length > 0) {
        casos.forEach(caso => {
          contextPrompt += `\n- Caso "${caso.titulo}" (${caso.numeroExpediente}):
          - Tipo: ${caso.tipo}
          - Estado: ${caso.estado}
          - Abogado asignado: ${caso.abogadoId ? `${caso.abogadoId.nombre} ${caso.abogadoId.apellido}` : 'No asignado'}`;
        });
      } else {
        contextPrompt += '\nNo tiene casos registrados actualmente.';
      }
    }

    contextPrompt += `\n\nPregunta del usuario: ${userMessage}\n\nPor favor, proporciona una respuesta profesional y útil utilizando markdown cuando sea apropiado:\n    - Usa **negrita** para enfatizar puntos importantes\n    - Usa listas donde sea apropiado\n    - Divide la respuesta en secciones si es necesario\n    - Si mencionas fechas o números de expediente, resáltalos\n    - Mantén un tono profesional pero amigable\n    - Responde de forma **concisa** y sólo con la información solicitada`;

    // Instrucciones adicionales sobre creación de casos
    contextPrompt += `\n\nSi el usuario desea **crear un nuevo caso**, asegúrate de recopilar o confirmar la siguiente información mínima:\n- **Título del caso**\n- **Tipo de caso**\n- **Prioridad**\n- **Descripción detallada**\n- Subida de **documentos** (opcional).`;

    return contextPrompt;
  }

  async *streamResponseFromOllama(userMessage) {
    try {
      const requestBody = {
        model: this.model,
        prompt: userMessage,
        stream: true, // Habilitamos streaming
        temperature: 0.7,
        max_tokens: 500,
      };

      console.log("Iniciando stream con Ollama");

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Procesar el buffer línea por línea
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                yield data.response;
              }
            } catch (e) {
              console.error('Error al parsear línea:', e);
            }
          }
        }
      }

      // Procesar cualquier dato restante en el buffer
      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer);
          if (data.response) {
            yield data.response;
          }
        } catch (e) {
          console.error('Error al parsear buffer final:', e);
        }
      }

    } catch (error) {
      console.error("Error en streamResponseFromOllama:", error);
      throw error;
    }
  }
}

module.exports = OllamaService;
