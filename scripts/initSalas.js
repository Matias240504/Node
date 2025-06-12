require("dotenv").config({ path: "../.env" }); // <-- Cargar el .env desde una carpeta arriba
const mongoose = require("mongoose");
const Sala = require("../models/salaModel");

// Conectar a la base de datos
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() =>
    console.log("Conexión a MongoDB establecida para inicializar salas")
  )
  .catch((err) => {
    console.error("Error al conectar a MongoDB:", err);
    process.exit(1);
  });

// Datos de salas para inicializar
const salasData = [
  {
    numero_de_sala: "101-A",
    disponibilidad: true,
    capacidad: 20,
    ubicacion: "Edificio A, Piso 1",
  },
  {
    numero_de_sala: "102-A",
    disponibilidad: true,
    capacidad: 15,
    ubicacion: "Edificio A, Piso 1",
  },
  {
    numero_de_sala: "201-A",
    disponibilidad: true,
    capacidad: 30,
    ubicacion: "Edificio A, Piso 2",
  },
  {
    numero_de_sala: "301-A",
    disponibilidad: true,
    capacidad: 25,
    ubicacion: "Edificio A, Piso 3",
  },
  {
    numero_de_sala: "101-B",
    disponibilidad: true,
    capacidad: 20,
    ubicacion: "Edificio B, Piso 1",
  },
  {
    numero_de_sala: "201-B",
    disponibilidad: true,
    capacidad: 35,
    ubicacion: "Edificio B, Piso 2",
  },
];

// Función para inicializar las salas
const initSalas = async () => {
  try {
    await Sala.deleteMany({});
    console.log("Salas existentes eliminadas");

    const salasCreadas = await Sala.insertMany(salasData);
    console.log(`${salasCreadas.length} salas creadas exitosamente`);

    salasCreadas.forEach((sala) => {
      console.log(
        `- Sala ${sala.numero_de_sala}: ${
          sala.disponibilidad ? "Disponible" : "No disponible"
        }, Capacidad: ${sala.capacidad}`
      );
    });

    console.log("Inicialización de salas completada");
    process.exit(0);
  } catch (error) {
    console.error("Error al inicializar salas:", error);
    process.exit(1);
  }
};

initSalas();
