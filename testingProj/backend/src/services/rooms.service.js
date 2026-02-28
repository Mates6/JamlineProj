import * as groupsModel from '../models/groups.model.js';

export async function userCanJoin(user_id, group_id, room_id){
    
    const room = await groupsModel.getRoomById(room_id);
    if(!room){
        throw new Error(`Room not found`);
    }

    if(room.group_id !== group_id){
        throw new Error(`Room does not belong to this group`);
    }

    const group = await groupsModel.getMembers(group_id);
    
    const isMember = group.members.some(m => m.user_id === user_id);
    if(!isMember)
        throw new Error(`User is not a member of this group`);

    return true;
}

export async function getRoomName(room_id){
    const room = await groupsModel.getRoomById(room_id);
    if(!room){
        throw new Error(`Room not found`);
    }

    return room.room_name;
}