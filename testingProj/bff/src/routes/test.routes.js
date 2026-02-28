import {Router} from 'express';
import { callBackend } from '../lib/backendClient.js';

const router = Router();

router.get('/test', async(req, res, next) =>{
    try{
        const data = await callBackend('users/getAllUsers');
        res.json(data);
    }   catch(err){
        next(err);
    }
});

export default router;