const mongoose = require('mongoose');
const { db } = require('../config.js');

// Conectar a MongoDB usando mongoose.connect
const connection = mongoose.connect(`mongodb://${db.host}:${db.port}/${db.database}`)
.then(() => {
    console.log('MongoDB connected successfully');
})
.catch((error) => {
    console.error('MongoDB connection failed', error.message);
});

module.exports = connection;
