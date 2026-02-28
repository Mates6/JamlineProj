import * as groupsService from '../services/groups.service.js';
import {generateUUID} from '../utils/uuid.js';

export async function getGroups(req, res, next) {

    try{
        const user_id = req.user.user_id;

        const groups = await groupsService.getUserGroups(user_id);
        res.json(groups);
    } catch (error) {
        next(error);
    }

}


export async function createGroup(req, res, next) {

    try{
        const group_owner = req.user.user_id;
        const group_name = req.body.group_name;
        const newGroup = await groupsService.createGroup(group_name, group_owner, generateUUID());
        res.status(201).json(newGroup);
    } catch (error) {
        next(error);
    }
}

export async function getGroupMembers(req, res, next) {

    try{
        const  group_id  = req.params.groupId;
        const getMembers = await groupsService.getMembers(group_id);
        res.status(200).json(getMembers);
    }   catch(err){
        next(err);
    }

}

export async function discoverGroups(req, res, next){
    try{
        const userId = req.user.user_id
        const groups = await groupsService.discoverGroups(userId);
        res.status(200).json(groups);
    }   catch(err){
        next(err);
    }
}

export async function joinGroup(req, res, next){
    try{
        const userId = req.user.user_id;
        const group_id = req.body.group_id;

        await groupsService.joinGroup(userId, group_id);

        res.json({message: 'Joined group successfully' });
    } catch(err){
        next(err);
    }
}

export async function getGroupOwner(req, res, next){
    try{
        const group_id = req.body.group_id
        const groupOwner = await groupsService.getGroupOwner(group_id);

        res.status(200).json(groupOwner);
    } catch(err){
        next(err);
    }
}


export async function deleteGroup(req, res, next){
    try{
        const user_id = req.user.user_id;
        const group_id = req.params.groupId;

        await groupsService.deleteGroup(group_id, user_id);

        res.status(200).json({message: 'Group deleted successfully'});
    } catch(err){
        next(err);
    }
}

export async function updateGroup(req, res, next){
    try{
        const group_id = req.params.groupId;
        const group_name = req.body.group_name;

        const response = await groupsService.updateGroup(group_id, group_name);

        res.status(200).json(response)
    }   catch(err){
        next(err);
    }
}


export async function leaveGroup(req, res, next){
    try{
        const user_id = req.user.user_id;
        const group_id = req.params.groupId;

        await groupsService.leaveGroup(group_id ,user_id);

        res.status(200).json({message: 'Left the group successfully'});
    } catch(err){
        next(err);
    }
}

export async function getRoomIds(req, res, next){
    try{
        const group_id = req.params.groupId;

        const response = await groupsService.getRoomIds(group_id);

        res.status(200).json(response);
    } catch(err){
        next(err);
    }
}

export async function getGroupName(req, res, next){
    try{
        const group_id = req.params.groupId;

        const response = await groupsService.getGroupName(group_id);

        res.status(200).json(response);
    }   catch(err){
        next(err);
    }
}

export async function sendMessage(req, res, next){
    try{
        const group_id = req.params.groupId;
        const user_id = req.user?.user_id ;
        const username = req.user?.username;
        const message = req.body.message;

        console.log('message: ', message);
        console.log('body raw: ', req.body);
        console.log('username: ', username);

        const response = await groupsService.sendMessage(group_id, user_id, username, message);
        res.status(200).json(response);
    } catch(err){
        next(err);
    }

}

export async function getMessages(req, res, next){
    try{
        const group_id = req.params.groupId;

        const response = await groupsService.getMessages(group_id);
        res.status(200).json(response);
    } catch(err){
        next(err);
    }
}