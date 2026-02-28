import {Router} from 'express';
import { callBackend } from '../lib/backendClient.js';
import { withAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/joinRoom/:groupId/:roomId', async(req, res, next) =>{
    try{
        const group_id = req.params.groupId;
        const room_id = req.params.roomId;

       return await withAuth(req, res, next, `rooms/joinRoom/${group_id}/${room_id}`, {method: 'POST'});
    } catch(err){
        next(err);
    }
});

router.get('/getRoomName/:groupId/:roomId', async(req, res, next) => {
    try{
        const group_id = req.params.groupId;
        const room_id = req.params.roomId;
        return await withAuth(req, res, next, `rooms/getRoomName/${group_id}/${room_id}`, {method: 'GET'});
    }
    catch(err){
        next(err);
    }
});

export default router;