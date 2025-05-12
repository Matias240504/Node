const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { nombre, apellido, dni, email, telefono, direccion, usuario, contrasena, documentoIdentidad } = req.body;

        const existingUser = await User.findOne({ usuario });
        if (existingUser) return res.status(400).json({ message: 'El usuario ya existe' });

        const hashedPassword = await bcrypt.hash(contrasena, 10);

        const newUser = new User({
            nombre,
            apellido,
            dni,
            email,
            telefono,
            direccion,
            usuario,
            contrasena: hashedPassword,
            documentoIdentidad,
            rol: 'cliente'
        });

        await newUser.save();
        res.status(201).json({ message: 'Usuario registrado correctamente' });
    } catch (err) {
        res.status(500).json({ error: 'Error al registrar usuario', details: err });
    }
};

exports.login = async (req, res) => {
      try {
        const { usuario, contrasena } = req.body;

        const user = await User.findOne({ usuario });
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        const isMatch = await bcrypt.compare(contrasena, user.contrasena);
        if (!isMatch) return res.status(401).json({ message: 'Contraseña incorrecta' });

        const token = jwt.sign(
            { id: user._id, rol: user.rol, usuario: user.usuario },
            process.env.JWT_SECRET_KEY,
            { expiresIn: '1d' }
        );

        res.status(200).json({ message: 'Login exitoso', token });
    } catch (err) {
        res.status(500).json({ error: 'Error al iniciar sesión', details: err });
    }
};