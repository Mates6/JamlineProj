import * as usersService from '../services/users.service.js';

export async function getAllUsers(req, res, next) {

    try{
        const users = await usersService.getAllUsers();
        res.json(users);
    }   catch(err){
        next(err);
    }
}