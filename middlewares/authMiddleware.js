const jwt = require('jsonwebtoken');
const  { jwtSecret } = require('../config');

const verificarToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect('/login');
    }

    try {
        const verificado = jwt.verify(token, jwtSecret);
        req.usuario = verificado;
        next();
    } catch (error) {
        return res.redirect('/login');
    }
};

module.exports = verificarToken;