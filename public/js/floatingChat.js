// Inicialización de variables
let socket;
let username = "";
let chatOpen = false;

// Función para crear los elementos del chat
function createChatElements() {
  // Crear el botón flotante
  const chatButton = document.createElement("div");
  chatButton.id = "chat-button";
  chatButton.className = "floating-chat-button";
  chatButton.innerHTML = '<i class="fas fa-comments"></i>';

  // Crear el contenedor del chat
  const chatContainer = document.createElement("div");
  chatContainer.id = "chat-container";
  chatContainer.className = "chat-container";

  // Crear la estructura interna del chat
  chatContainer.innerHTML = `
    <div class="chat-header">
      <h3>Chat de Clientes</h3>
      <button id="close-chat" class="close-chat"><i class="fas fa-times"></i></button>
    </div>
    <div id="chat-messages" class="chat-messages"></div>
    <div id="typing-indicator" class="typing-indicator"></div>
    <div class="chat-input">
      <input type="text" id="chat-input" placeholder="Escribe un mensaje...">
      <button id="send-button"><i class="fas fa-paper-plane"></i></button>
    </div>
  `;

  // Agregar elementos al body
  document.body.appendChild(chatButton);
  document.body.appendChild(chatContainer);
}

// Función para inicializar el chat
function initChat() {
  // Obtener el nombre de usuario del localStorage si está disponible
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  if (userData && userData.nombre) {
    username = userData.nombre;
  } else {
    username = "Usuario_" + Math.floor(Math.random() * 1000);
  }

  // Inicializar Socket.io
  socket = io();

  // Manejar la recepción de todos los mensajes
  socket.on("all-messages", (messages) => {
    const chatMessages = document.getElementById("chat-messages");
    let content = "";

    for (const message of messages) {
      const messageClass = message.username === username ? "user" : "other";
      const formattedMessage = `
        <div class="message ${messageClass}">
          <div class="message-sender">${message.username}</div>
          <div class="message-content">${message.message}</div>
        </div>
      `;
      content += formattedMessage;
    }

    chatMessages.innerHTML = content;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  // Manejar mensajes individuales para actualización en tiempo real
  socket.on("new-message", (message) => {
    console.log("Nuevo mensaje recibido:", message);
    if (!message || !message.message) {
      console.error("Mensaje inválido recibido:", message);
      return;
    }

    const chatMessages = document.getElementById("chat-messages");
    const messageClass = message.username === username ? "user" : "other";
    const messageElement = document.createElement("div");
    messageElement.className = `message ${messageClass}`;
    messageElement.innerHTML = `
      <div class="message-sender">${message.username}</div>
      <div class="message-content">${message.message}</div>
    `;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Limpiar el indicador de escritura si el mensaje es del asistente
    if (message.username === "Asistente") {
      const typingIndicator = document.getElementById("typing-indicator");
      typingIndicator.textContent = "";
    }
  });

  // Manejar indicador de escritura
  socket.on("writing", (user) => {
    const typingIndicator = document.getElementById("typing-indicator");
    if (user !== username) {
      typingIndicator.textContent = `${user} está escribiendo...`;
      setTimeout(() => {
        typingIndicator.textContent = "";
      }, 3000);
    }
  });

  // Configurar eventos para el botón de enviar y el input
  const chatInput = document.getElementById("chat-input");
  const sendButton = document.getElementById("send-button");

  // Función para enviar mensaje
  function sendMessage() {
    const message = chatInput.value.trim();
    if (message) {
      socket.emit("new-message", {
        username: username,
        message: message,
      });
      chatInput.value = "";
    }
  }

  // Enviar mensaje al hacer clic en el botón
  sendButton.addEventListener("click", sendMessage);

  // Enviar mensaje al presionar Enter
  chatInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      sendMessage();
      event.preventDefault();
    }
  });

  // Emitir evento de escritura
  chatInput.addEventListener("input", () => {
    socket.emit("writing", username);
  });

  // Configurar eventos para abrir/cerrar el chat
  const chatButton = document.getElementById("chat-button");
  const chatContainer = document.getElementById("chat-container");
  const closeChat = document.getElementById("close-chat");

  chatButton.addEventListener("click", () => {
    chatContainer.classList.toggle("active");
    chatOpen = !chatOpen;
    if (chatOpen) {
      chatInput.focus();
    }
  });

  closeChat.addEventListener("click", () => {
    chatContainer.classList.remove("active");
    chatOpen = false;
  });
}

// Inicializar cuando el DOM esté cargado
document.addEventListener("DOMContentLoaded", () => {
  createChatElements();
  initChat();
});
