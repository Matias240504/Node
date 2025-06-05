console.log("fetch existe:", typeof fetch);

class OllamaService {
  constructor() {
    this.apiUrl = "http://localhost:11434/api/generate";
    this.model = "gemma3"; // Usando el modelo que tenemos instalado
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
        data: data,
      });

      if (!data.response) {
        throw new Error("Respuesta vacía de Ollama");
      }

      return data.response.trim();
    } catch (error) {
      console.error("Error al consultar Ollama:", error);
      return "Lo siento, hubo un error al generar la respuesta.";
    }
  }
}

module.exports = OllamaService;
