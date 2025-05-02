const User = require('../models/userModel');

class UserService {
    constructor() {}

    async getAll() {
        const users = await User.find({});
        return users;
    }

    async getById(id) {
        const user = await User.find({_id:id});
        return user;
    }

    async create(data){
        const user = new User(data);
        return await user.save()
            .then((result) => {
                return {status: true, data: result}
            })
            .catch((error) => {
                return {status: false, error: error.message}
            });
    }
}
module.exports = UserService;