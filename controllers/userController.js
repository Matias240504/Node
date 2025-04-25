exports.getAllUsers = (req, res) => {
    res.status(200).send('Accediendo a los usuarios');
    console.log("Accediendo a todos los usuarios");
}

exports.getUser = (req, res) => {
    console.log(req.query.enabled);
    res.send(`Accediendo al usuario con id: ${req.params.id}`);
}

exports.createUser = (req, res) => {
    let data = req.body;
    const {nombre, apellido, email, telefono} = data;
    res.send(`Creando usuario con nombre: ${nombre}, apellido: ${apellido}, email: ${email}, telefono: ${telefono}`);
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