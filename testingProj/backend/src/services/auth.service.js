import * as authModel from '../models/auth.model.js';
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';

export async function login(username, password) {
    const user = await authModel.findByUsername(username);
    if (!user) {
        const err = new Error('Username is incorrect');
        err.status = 401;
        throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        const err = new Error('Password is incorrect');
        err.status = 401;
        throw err;
    }

    await authModel.deleteRefreshTokensForUser(user.user_id);


    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await authModel.storeRefreshToken(user.user_id, refreshToken);

    delete user.password;
    return {user, accessToken, refreshToken};
}

export async function register(uuid, username, password, email) {

    const existingUser = await authModel.findByUsername(username);
    if (existingUser) {
        const err = new Error('Username already taken');
        err.status = 409;
        throw err;
    }
    const existingEmail = await authModel.findByEmail(email);
    if (existingEmail) {
        const err = new Error('Email already registered');
        err.status = 409;
        throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await authModel.register(uuid, username, hashedPassword, email); 

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await authModel.storeRefreshToken(user.user_id, refreshToken);

    return {user, accessToken, refreshToken};
}

export async function deleteRefreshToken(refreshToken) {
    await authModel.deleteRefreshToken(refreshToken);
}