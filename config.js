module.exports = {
    db:{
        host: 'localhost',
        user: '',
        password: '',
        database: 'mydb1',
        port: 27017
    },
    jwtExpiresIn: '1d', // tiempo de expiración del token JWT
    jwtSecret: 'secretoSuperSeguro123', // cambia esto por una cadena más segura
}