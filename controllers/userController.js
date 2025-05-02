const UserService = require('../services/userService');
const userService = new UserService();

exports.getAllUsers = async(req, res) => {
    const users = await userService.getAll();
    res.status(200).send(users);
}

exports.getUser = async(req, res) => {
    const id = req.params.id;
    const user = await userService.getById(id);
    if (!user) {
        return res.status(404).json({"message": "Usuario no encontrado"});
    }

    res.status(200).send(user);
}

exports.createUser = async(req, res) => {
    try {
        let data = req.body;
            await userService.create(data)
        res.status(200).send('Se ha creado el usuario correctamente');
    } catch (error) {
        res.status(500).send({"error": error.message});
    }
}

exports.updateUser = (req, res) => {
    let data = req.body;
    const {nombre, apellido, email, telefono} = data;
    console.log(`Actualizando usuario con id: ${req.params.id}, nombre: ${nombre}, apellido: ${apellido}, email: ${email}, telefono: ${telefono}`);
    console.log(req.params.id);
}

exports.deleteUser = (req, res) => {
    console.log(`Eliminando usuario con id: ${req.params.id}`);
}