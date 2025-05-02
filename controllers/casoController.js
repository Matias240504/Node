const CasoService = require('../services/casoService');
const casoService = new CasoService();

exports.getAllCasos = async (req, res) => {
    const casos = await casoService.getAll();
    res.status(200).send(casos);
};

exports.getCaso = async (req, res) => {
    const id = req.params.id;
    const caso = await casoService.getById(id);
    if (!caso) {
        return res.status(404).json({ message: "Caso no encontrado" });
    }
    res.status(200).send(caso);
};

exports.createCaso = async (req, res) => {
    try {
        let data = req.body;
        await casoService.create(data);
        res.status(200).send('Se ha creado el caso correctamente');
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};
