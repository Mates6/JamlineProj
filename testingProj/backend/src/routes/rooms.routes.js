import {Router} from 'express';
import { authRequired } from '../middleware/auth.js';
import * as roomsController from '../controllers/rooms.controller.js';

const router = Router();

router.post('/joinRoom/:groupId/:roomId', authRequired, roomsController.joinRoom);

router.get('/getRoomName/:groupId/:roomId', authRequired, roomsController.getRoomName);

export default router;