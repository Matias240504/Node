const ClienteService = require('../services/clienteService');
const clienteService = new ClienteService();

exports.getAllClientes = async (req, res) => {
    const clientes = await clienteService.getAll();
    res.status(200).send(clientes);
};

exports.getCliente = async (req, res) => {
    const id = req.params.id;
    const cliente = await clienteService.getById(id);
    if (!cliente) {
        return res.status(404).json({ message: "Cliente no encontrado" });
    }
    res.status(200).send(cliente);
};

exports.createCliente = async (req, res) => {
    try {
        let data = req.body;
        await clienteService.create(data);
        res.status(200).send('Se ha creado el cliente correctamente');
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};
