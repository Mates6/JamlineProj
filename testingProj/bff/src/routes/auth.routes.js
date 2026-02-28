import {Router} from 'express';
import { callBackend } from '../lib/backendClient.js';
const router = Router();

router.post('/login', async(req, res, next) =>{
    console.log("BFF LOGIN BODY:", req.body);
    try{
        const data = await callBackend('auth/login', {
            method: 'POST',
            body: JSON.stringify(req.body),
            headers: { 'Content-Type': 'application/json' }
        });

        req.session.tokens = {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken
        };
        /*const accessToken = data.accessToken; LEN NA TESTOVANIE V POSTMANOVI*/
        req.session.user = data.user;

        res.status(200).json({ success: true, user: data.user/*, token: accessToken */});

    } catch(err){
        next(err);
    }
});

router.get('/me', (req, res) => {
    if(!req.session.user){
        return res.status(401).json({ message: "Not authenticated"});
    }

    res.json(req.session.user);
});

router.post('/register', async(req, res, next) =>{
    try{
        const data = await callBackend('auth/register', {
            method: 'POST',
            body: JSON.stringify(req.body),
            headers: { 'Content-Type': 'application/json' }
        });
        res.status(201).json(data);
    } catch(err){
        next(err);
    }
});


router.post('/logout', async(req, res, next) =>{
    try{
        const refreshToken = req.session.tokens?.refreshToken;
        console.log("BFF LOGOUT: session tokens:", req.session.tokens);
        const data = await callBackend('auth/logout', {
            method: 'POST',
            body: JSON.stringify({refreshToken}),
            headers: { 'Content-Type': 'application/json' }
        });
        //onsole.log("WHAT IS THIS BRADAR: ",data);
        req.session.destroy(() =>{
            res.json({ success: true});
        });
        //res.status(200).json(data); toto je useless, len to pise logged out successfully, neviem preco som to tam mal, ale asi to malo nejaky dovod, asi pre postmana
    } catch(err){
        next(err);
    }
});

router.post('/refresh', async(req, res, next) => {

    try{
        const data = await callBackend('auth/refreshToken', {
            method: 'POST',
            body: JSON.stringify(req.body),
            headers: { 'Content-Type' : 'application/json'}
        });

        res.json(data);
    } catch(err){
        next(err);
    }
});

export default router;