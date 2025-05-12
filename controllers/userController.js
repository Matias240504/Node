const User = require('../models/userModel');
const bcrypt = require('bcrypt');

//mostrar formulario de registro
const mostrarFormularioRegistro = (req, res) => {
    res.render('registro');
}

//registrar usuario
const registrarUsuario = async (req, res) => {
    const { nombre, apellido, dni, email, telefono, direccion, usuario, contrasena } = req.body;

    try {
        //Usuario existe?
        const existe = await User.findOne({ usuario });
        if (existe) {
            return res.send( 'El usuario ya existe' );
        }

        const hashedPassword = await bcrypt.hash(contrasena, 10);

        const nuevoUsuario = new User({
            nombre,
            apellido,
            dni,
            email,
            telefono,
            direccion,
            usuario,
            contrasena: hashedPassword,
            fechaRegistro: new Date()
        });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
    }
};

module.exports = {
    mostrarFormularioRegistro,
    registrarUsuario
}