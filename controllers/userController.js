const User = require('../models/UserModel'); // Asegúrate de que la ruta sea correcta
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    function capitalizar(texto) {
    return texto
        .toLowerCase()
        .split(' ')
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join(' ');
    }

    try {
        const { nombre, apellido, dni, email, telefono, direccion, contrasena, confirmContrasena } = req.body;

        // Validaciones
        const soloLetrasRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
        const soloNumerosRegex = /^[0-9]+$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const contrasenaRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;

        if (!soloLetrasRegex.test(nombre)) {
            return res.status(400).json({ message: 'El nombre solo debe contener letras' });
        }

        if (!soloLetrasRegex.test(apellido)) {
        return res.status(400).json({ message: 'El apellido solo debe contener letras' });
        }

        if (!soloNumerosRegex.test(dni) || dni.length !== 8) {
        return res.status(400).json({ message: 'El DNI debe contener solo 8 números' });
        }

        if (!soloNumerosRegex.test(telefono)) {
        return res.status(400).json({ message: 'El teléfono solo debe contener números' });
        }

        if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Correo inválido' });
        }

        if (!contrasenaRegex.test(contrasena)) {
        return res.status(400).json({
            message: 'La contraseña debe tener al menos 6 caracteres, una letra mayúscula y un número'
        });
        }

        if (contrasena !== confirmContrasena) {
            return res.status(400).json({ message: 'Las contraseñas no coinciden' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'El usuario ya existe' });

        const hashedPassword = await bcrypt.hash(contrasena, 10);

        const newUser = new User({
            nombre: capitalizar(nombre),
            apellido: capitalizar(apellido),
            dni,
            email,
            telefono,
            direccion: capitalizar(direccion),
            contrasena: hashedPassword,
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
        const { email, contrasena } = req.body;

        const user = await User.findOne({ email });
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