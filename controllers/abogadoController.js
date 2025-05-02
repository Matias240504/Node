const AbogadoService = require('../services/abogadoService');
const abogadoService = new AbogadoService();

exports.getAllAbogados = async (req, res) => {
    const abogados = await abogadoService.getAll();
    res.status(200).send(abogados);
};

exports.getAbogado = async (req, res) => {
    const id = req.params.id;
    const abogado = await abogadoService.getById(id);
    if (!abogado) {
        return res.status(404).json({ message: "Abogado no encontrado" });
    }
    res.status(200).send(abogado);
};

exports.createAbogado = async (req, res) => {
    try {
        let data = req.body;
        await abogadoService.create(data);
        res.status(200).send('Se ha creado el abogado correctamente');
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};
