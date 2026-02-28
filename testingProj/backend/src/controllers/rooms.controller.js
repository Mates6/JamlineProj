import * as roomsService from '../services/rooms.service.js';

export async function joinRoom(req, res, next){
    try{
        const user_id = req.user.user_id;
        console.log("USER ID: ",req.user.user_id);
        const room_id = req.params.roomId;
        const group_id = req.params.groupId;

        const allowed = await roomsService.userCanJoin(user_id, group_id, room_id);

        if(!allowed){
            return res.status(403).json({message: "not allowed"});
        }

        res.status(200).json({ message: "user joined"});
    } catch(err){

        if(err.message === 'Room not found')
            return res.status(404).json({message: "Room not found"});
        if(err.message === 'Room does not belong to this group')
            return res.status(400).json({message: "Room does not belong to this group"});
        if(err.message === 'User is not a member of this group')
            return res.status(403).json({message: "User is not a member of this group"});

        next(err);
    }
}

export async function getRoomName(req, res, next){
    try{
        const room_id = req.params.roomId;

        const roomName = await roomsService.getRoomName(room_id);

        if(!roomName){
            return res.status(404).json({message: "Room not found"});
        }

        res.status(200).json({ roomName});
    } catch(err){
        if(err.message === 'Room not found'){
            return res.status(404).json({error : 'Room not found'});
        }
        next(err);
    }
}