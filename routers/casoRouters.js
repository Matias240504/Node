const express = require('express');
const router = express.Router();

const casoController = require('../controllers/casoController');

router.get('/', casoController.getAllCasos);
router.get('/:id', casoController.getCaso);
router.post('/', casoController.createCaso);

module.exports = router;
