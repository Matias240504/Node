const express = require('express');
const router = express.Router();

const abogadoController = require('../controllers/abogadoController');

router.get('/', abogadoController.getAllAbogados);
router.get('/:id', abogadoController.getAbogado);
router.post('/', abogadoController.createAbogado);

module.exports = router;
