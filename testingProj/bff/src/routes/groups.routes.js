import {Router} from 'express';
import { callBackend } from '../lib/backendClient.js';
import { withAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/getGroups', async(req, res, next) => {
    try{

        await withAuth(req, res, next, "groups/getGroups", { method: 'GET'});
       /* const authHeader = req.headers['authorization'];

        if(!authHeader){
            return res.status(401).json({message: 'Missing authorization header'});
        }

        console.log("BFF Authorization:", req.headers.authorization);

        const data = await callBackend('groups/getGroups',{
            method: 'GET',
            headers:{ 'Authorization': `${authHeader}`}
        });
        res.status(200).json(data);*/
    }   catch(err){
        next(err);
    }
});

router.get('/:groupId/members', async(req, res, next) => {
    try{
        const group_id = req.params.groupId;
        await withAuth(req, res, next, `groups/${group_id}/members`, { method: 'GET'});
        /*const authHeader = req.headers['authorization'];

        if(!authHeader){
            return res.status(401).json({ message: 'Missing authorization header'});
        }
        const group_id = req.params.groupId;

        const data = await callBackend(`groups/${group_id}/members`,{
            method: 'GET',
            headers: { 'Authorization': authHeader}
        });
        res.status(200).json(data);*/
    }   catch(err){
        next(err);
    }
});


router.post('/createGroup', async(req, res, next) => {
        try{

        await withAuth(req, res, next, 'groups/createGroup',{
            method: 'POST',
            body: JSON.stringify(req.body),
            headers: { 'Content-Type': 'application/json' }
        })
        /*const authHeader = req.headers['authorization'];

        if(!authHeader){
            return res.status(401).json({ message: 'Missing authorization header'});
        }

        const data = await callBackend('groups/createGroup',{
            method: 'POST',
            body: JSON.stringify(req.body),
            headers:{
                'Authorization': authHeader,
                'Content-Type' : 'application/json'
            }

        })

        res.json(data);*/
        } catch(err){
            if(err.status === 409){
                return res.status(409).json({message: 'Group name already taken'});
            }
            next(err);
        }
})


router.get('/discoverGroups', async (req, res, next) => {
    try {

        await withAuth(req, res, next, 'groups/discoverGroups', {
            method: 'GET'
        });
        /*const authHeader = req.headers['authorization'];

        if(!authHeader){
            return res.status(401).json({ message: 'Missing authorization header'});
        }

        const data = await callBackend('groups/discoverGroups', {
            method: 'GET',
            headers: { Authorization: authHeader }
        });

        res.json(data);*/
    } catch (err) {
        next(err);
    }
});


router.post('/joinGroup', async (req, res, next) => {
    try {

        await withAuth(req, res, next, 'groups/joinGroup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(req.body)
        });
        /*const authHeader = req.headers['authorization'];

        const data = await callBackend('groups/joinGroup', {
            method: 'POST',
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        res.json(data);*/
    } catch (err) {
        next(err);
    }
});


router.delete('/:groupId', async (req, res, next) =>{
    try{
        const group_id = req.params.groupId;
        await withAuth(req, res, next, `groups/${group_id}`, {
            method: 'DELETE'
        });

       /* const authHeader = req.headers['authorization'];
        const group_id = req.params.groupId;

        if(!authHeader){
            return res.status(401).json({ message: 'Missing authorization header'});
        }

        const data = await callBackend(`groups/${group_id}`,{
            method: 'DELETE',
            headers: {
                Authorization: authHeader,
            }
        });

        res.json(data)*/

    }  catch(err){
        next(err);
    }
});

router.patch('/:groupId/update', async (req, res, next) =>{
    try{
        const group_id = req.params.groupId;
        await withAuth(req, res, next, `groups/${group_id}/update`, {
            method: 'PATCH',
            headers: { 'Content-Type' : 'application/json'},
            body: JSON.stringify(req.body)
        });

        /*const authHeader = req.headers['authorization'];
        const group_id = req.params.groupId;

        if(!authHeader){
            return res.status(401).json({ message: 'Missing authorization header'});
        }

        const data = await callBackend(`groups/${group_id}/update`,{
            method: 'PATCH',
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        res.json(data)*/

    }  catch(err){
        if(err.status === 409){
                return res.status(409).json({message: 'Group name already taken'});
            }
        next(err);
    }
});


router.post('/:groupId/leaveGroup', async (req, res, next) =>{
    try{
        const group_id = req.params.groupId;
        await withAuth(req, res, next, `groups/${group_id}/leaveGroup`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });

        /*const authHeader = req.headers['authorization'];
        const group_id = req.params.groupId;

        if(!authHeader){
            return res.status(401).json({ message: 'Missing authorization header'});
        }

        const data = await callBackend(`groups/${group_id}/leaveGroup`,{
            method: 'POST',
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json'
            }
        });

        res.json(data)*/

    }  catch(err){
        next(err);
    }
});

router.get('/:groupId/getRoomIds', async(req, res, next) =>{
    try{

        const group_id = req.params.groupId;
        await withAuth(req, res, next, `groups/${group_id}/getRoomIds`, {
            method: 'GET',
        });

        /*const authHeader = req.headers['authorization'];
        const group_id = req.params.groupId;

        if(!authHeader){
            return res.status(401).json({ message: 'Missing authorization header'});
        }

        const data = await callBackend(`groups/${group_id}/getRoomIds`,{
            method: "GET",
            headers: {Authorization : authHeader}
        })

        res.json(data);*/
    } catch(err){
        next(err);
    }
});

router.get('/:groupId/getGroupName', async(req, res, next) =>{
    try{
        const group_id = req.params.groupId;
        await withAuth(req, res, next, `groups/${group_id}/getGroupName`, {
            method: 'GET'
        });

        /*const authHeader = req.headers['authorization'];
        const group_id = req.params.groupId;

        if(!authHeader){
            return res.status(401).json({ message: 'Missing authorization header'});
        }

        const data = await callBackend(`groups/${group_id}/getGroupName`,{
            method: "GET",
            headers: {Authorization : authHeader}
        })

        res.json(data);*/
    } catch(err){
        next(err);
    }
});

router.post('/:groupId/sendMessage', async(req, res, next) => {
    try{
        const group_id = req.params.groupId;
        await withAuth(req, res, next, `groups/${group_id}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(req.body)
        });

    } catch(err){
        next(err);
    }
});

router.get('/:groupId/getMessages', async(req, res, next) => {
    try{
        const group_id = req.params.groupId;
        await withAuth(req, res, next, `groups/${group_id}/getMessages`,{
            method: 'GET'
        });
    } catch(err){
        next(err);
    }
});



export default router;