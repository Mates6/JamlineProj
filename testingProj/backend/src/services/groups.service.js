import * as groupsModel from '../models/groups.model.js';

export async function getUserGroups(user_id) {

    return await groupsModel.getGroups(user_id);

}


export async function createGroup(group_name, group_owner, uuid) {

    return await groupsModel.createGroup(group_name, group_owner, uuid);
}

export async function getMembers(group_id){
    return await groupsModel.getMembers(group_id);
}

export async function discoverGroups(userId){
    return await groupsModel.getGroupsUserIsNotIn(userId);
}

export async function joinGroup(userId, group_id){
    return await groupsModel.addUserToGroup(userId, group_id);
}

export async function getGroupOwner(group_id){
    return await groupsModel.getGroupOwner(group_id);
}

export async function deleteGroup(group_id){
    return await groupsModel.deleteGroup(group_id);
}

export async function updateGroup(group_id, group_name){
    return await groupsModel.updateGroup(group_id, group_name);
}

export async function leaveGroup(group_id, user_id){
    return await groupsModel.leaveGroup(group_id, user_id);
}

export async function getRoomIds(group_id){
    return await groupsModel.getRoomIds(group_id);
}

export async function getGroupName(group_id){
    return await groupsModel.getGroupName(group_id);
}

export async function sendMessage(group_id, user_id, username, message){
    return await groupsModel.sendMessage(group_id, user_id, username, message);
}

export async function getMessages(group_id){
    return await groupsModel.getMessages(group_id);
}