import * as usersModel from '../models/users.model.js';

export  function getAllUsers() {
    return usersModel.getAllUsers();
}