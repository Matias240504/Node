// routers/clienteRouters.js
const express = require('express');
const router = express.Router();

const clienteController = require('../controllers/clienteController');

router.get('/', clienteController.getAllClientes);
router.get('/:id', clienteController.getCliente);
router.post('/', clienteController.createCliente);

module.exports = router;
