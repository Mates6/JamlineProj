import {Router} from 'express';
import * as groupsController from '../controllers/groups.controller.js';
import {validate} from '../middleware/validate.js';
import {createGroupSchema} from '../validators/createGroup.js';
import { authRequired } from '../middleware/auth.js';  
import { ownerOnly } from '../middleware/ownerOnly.js';

const router = Router();

router.get('/getGroups' , authRequired ,groupsController.getGroups);

router.post('/createGroup', authRequired ,validate(createGroupSchema) , groupsController.createGroup);

router.get(`/:groupId/members`, authRequired, groupsController.getGroupMembers);

router.get('/discoverGroups', authRequired, groupsController.discoverGroups);

router.post('/joinGroup', authRequired, groupsController.joinGroup);

router.get('/getGroupOwner', authRequired, groupsController.getGroupOwner);

router.delete('/:groupId', authRequired, ownerOnly, groupsController.deleteGroup);

router.patch('/:groupId/update', authRequired, ownerOnly, groupsController.updateGroup);

router.post('/:groupId/leaveGroup', authRequired, groupsController.leaveGroup);

router.get('/:groupId/getRoomIds', authRequired, groupsController.getRoomIds);

router.get('/:groupId/getGroupName', authRequired, groupsController.getGroupName);

router.post('/:groupId/sendMessage', authRequired, groupsController.sendMessage);

router.get('/:groupId/getMessages', authRequired, groupsController.getMessages);

export default router;