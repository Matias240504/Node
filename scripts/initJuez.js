#!/usr/bin/env node
/**
 * Script de inicialización para crear un usuario con rol Juez.
 * Uso:
 *   node scripts/initJuez.js --nombre="Juan" --apellido="Pérez" --email="juez@example.com" --contrasena="123456" [--dni="12345678"]
 * Si el email ya existe, no crea duplicado.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const yargs = require('yargs');
const path = require('path');

// Cargar variables de entorno desde .env en la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/userModel');

// Parsear argumentos de línea de comandos
const argv = yargs
  .option('nombre', { demandOption: true, type: 'string' })
  .option('apellido', { demandOption: true, type: 'string' })
  .option('email', { demandOption: true, type: 'string' })
  .option('contrasena', { demandOption: true, type: 'string' })
  .option('dni', { type: 'string' })
  .strict().argv;

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB');

    // Verificar si el juez ya existe
    const existing = await User.findOne({ email: argv.email });
    if (existing) {
      console.log(`El usuario con email ${argv.email} ya existe. Abortando.`);
      process.exit(0);
    }

    // Crear nuevo usuario juez
    const nuevoJuez = new User({
      nombre: argv.nombre,
      apellido: argv.apellido,
      email: argv.email,
      contrasena: argv.contrasena, // se guarda tal cual, asumiendo que hay hash en middleware si aplica
      dni: argv.dni || '',
      rol: 'juez',
      especialidad: 'General',
      estado: 'activo',
    });

    await nuevoJuez.save();
    console.log('Juez creado exitosamente:', nuevoJuez.email);
  } catch (err) {
    console.error('Error al crear juez:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
