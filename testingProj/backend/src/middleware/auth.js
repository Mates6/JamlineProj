import { verifyAccessToken } from "../utils/jwt.js";

export function authRequired(req, res, next) {

    const header = req.headers.authorization;

    if(!header || !header.startsWith('Bearer ')){
        return res.status(401).json({ message: 'Authorization header missing or malformed' });
    }

    const token = header.split(' ')[1];

    try{
        const payload = verifyAccessToken(token);
        req.user = payload;
        next();
    } catch (err){
        return  res.status(401).json({ message: 'Invalid or expired token' });
    }

}