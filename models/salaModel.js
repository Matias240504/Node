// models/Sala.js
const mongoose = require('mongoose');

const salaSchema = new mongoose.Schema({
  numeroSala: String
});

module.exports = mongoose.model('Sala', salaSchema);
