const express = require('express');
const router = express.Router();
const personaController = require('../controllers/personaController');

router.get('/', personaController.getAllPersonas);
router.get('/:id', personaController.getPersona);
router.post('/', personaController.createPersona);

module.exports = router;