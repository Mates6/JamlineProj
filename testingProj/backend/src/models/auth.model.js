import { token } from 'morgan';
import {pool} from '../config/db.js';
import {generateUUID} from '../utils/uuid.js';

export async function findByUsername(username) {

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    return result.rows[0];
}

export async function findByEmail(email) {

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    return result.rows[0];
}

export async function findById(userId) {

    const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);

    return result.rows[0];
}


export async function register(uuid, username, password, email){

    const result = await pool.query('INSERT INTO users (user_id, username, email, password) VALUES ($1, $2, $3, $4) RETURNING user_id, username, email', 
    [uuid, username, email, password]);
    
    return result.rows[0];
}


export async function storeRefreshToken(user_id, refreshToken) {
    const token_id = generateUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    //const expiresAt = new Date(Date.now() + 10 * 1000);
    await pool.query('INSERT INTO refresh_tokens (token_id, user_id, refresh_token, expires_at) VALUES ($1, $2, $3, $4)',[token_id, user_id, refreshToken, expiresAt]);

    return token_id;
}

//refresh endpoint, taktiez post 
export async function findRefreshToken(refreshToken) {
    const result = await pool.query('SELECT * FROM refresh_tokens WHERE refresh_token = $1', [refreshToken]); 
    
    return result.rows[0];
}

// logout endpoint, taktiez post 
export async function deleteRefreshToken(refreshToken) {
    const result = await pool.query('SELECT user_id FROM refresh_tokens WHERE refresh_token = $1', [refreshToken]);
    if(result.rows.length === 0) return;

    const user_id = result.rows[0].user_id;

    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [user_id]);
}

export async function deleteRefreshTokensForUser(user_id){
    await pool.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [user_id]);
     
}