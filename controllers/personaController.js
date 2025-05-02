const PersonaService = require('../services/personaService');
const personaService = new PersonaService();

exports.getAllPersonas = async (req, res) => {
    const personas = await personaService.getAll();
    res.status(200).send(personas);
};

exports.getPersona = async (req, res) => {
    const id = req.params.id;
    const persona = await personaService.getById(id);
    if (!persona) {
        return res.status(404).json({ "message": "Persona no encontrada" });
    }
    res.status(200).send(persona);
};

exports.createPersona = async (req, res) => {
    try {
        const data = req.body;
        const result = await personaService.create(data);
        if (result.status) {
            res.status(200).send('Se ha creado la persona correctamente');
        } else {
            res.status(400).send({ error: result.error });
        }
    } catch (error) {
        res.status(500).send({ "error": error.message });
    }
};