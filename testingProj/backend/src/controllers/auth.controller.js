import * as authService from '../services/auth.service.js';
import {generateUUID} from '../utils/uuid.js';
import * as authModel from '../models/auth.model.js';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '../utils/jwt.js';

export async function login(req, res, next) {
    console.log("BFF LOGIN BODY:", req.body);
    try {
        const { username, password } = req.body;
        const user = await authService.login(username, password);
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
}

export async function register(req, res, next) {
    try {
        const { username, password, email } = req.body;
        const newUser = await authService.register(generateUUID(), username, password, email);
        res.status(201).json(newUser);
    } catch (error) {
        return next(error);
    }
}

export async function logout(req, res, next) {
    try {
        const { refreshToken } = req.body;
        console.log("BACKEND LOGOUT: received refreshToken:", refreshToken);
        await authModel.deleteRefreshToken(refreshToken);
        res.status(200).json({ message: 'Logged out successfully' });
    } catch(err){
        next(err);
    }
}

export async function refreshToken(req, res, next) {
    try {
        const { refreshToken } = req.body;

        console.log("BACKEND REFRESH: received refreshToken from BFF:", refreshToken);

        if(!refreshToken) {
            console.log("BACKEND REFRESH: missing refreshToken");
            return res.status(400).json({ message: 'Refresh token is required' });
        }

        const dbToken = await authModel.findRefreshToken(refreshToken);
        console.log("BACKEND REFRESH: dbToken found:", dbToken);
        if (!dbToken) {
            console.log("BACKEND REFRESH: token NOT found in DB → INVALID");
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        if(new Date(dbToken.expires_at) < new Date()){
            console.log("BACKEND REFRESH: token expired");
            return res.status(401).json({message: 'Refresh token expired'});
        }

        const userId = dbToken.user_id;

        const user = await authModel.findById(userId);

        const newAccessToken = generateAccessToken(user);

        const newRefreshToken = generateRefreshToken(user);

        console.log("BACKEND REFRESH: deleting old token:", refreshToken);
        await authModel.deleteRefreshToken(refreshToken);

        console.log("BACKEND REFRESH: storing new token:", newRefreshToken);
        await authModel.storeRefreshToken(userId, newRefreshToken);



        return res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        })

    } catch(err){
        next(err);
    }
}
