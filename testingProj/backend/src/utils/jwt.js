import jwt from 'jsonwebtoken';


const ACCESS_SECRET = process.env.ACCESS_SECRET || "supersecret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refreshsecret";



export function generateAccessToken(user){

    return jwt.sign(
        {
            user_id: user.user_id,
            username: user.username
        },
        ACCESS_SECRET,
        {expiresIn: '15m'}
    );
}

export function generateRefreshToken(user){
    return jwt.sign(
        { user_id: user.user_id},
        REFRESH_SECRET,
        {expiresIn: '7d'}
    )
}



export function verifyAccessToken(token){
    return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token){
    return jwt.verify(token, REFRESH_SECRET);
}