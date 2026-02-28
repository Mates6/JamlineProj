import {Router} from 'express';
import users from './users.routes.js';
import groups from './groups.routes.js';
import auth from './auth.routes.js';
import rooms from './rooms.routes.js'

const router = Router();

router.use('/users', users);
router.use('/groups', groups);
router.use('/auth', auth);
router.use('/rooms', rooms);

export default router;