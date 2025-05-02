const Cliente = require('../models/clienteModel');

class ClienteService {
    async getAll() {
        const clientes = await Cliente.find({});
        return clientes;
    }

    async getById(id) {
        const cliente = await Cliente.findById(id);
        return cliente;
    }

    async create(data) {
        const nuevoCliente = new Cliente(data);
        return await nuevoCliente.save();
    }
}

module.exports = ClienteService;
