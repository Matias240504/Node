const userLogin = (req, res, next) => {
    let isLogin = true; 
    if (!isLogin) {
        return res.status(401).json({'message': 'Usuario no autorizado'}); 
    }
    next(); // Si el usuario está autorizado, continuar con la siguiente función middleware o ruta
}

module.exports = userLogin; // Exportar el middleware para usarlo en otros archivos