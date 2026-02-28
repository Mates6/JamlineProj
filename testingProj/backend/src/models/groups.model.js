import {pool} from '../config/db.js';
import {generateUUID} from '../utils/uuid.js'

export async function getGroups(user_id) {
    const result =  await pool.query(
       `SELECT g.group_id, g.group_name, g.group_owner FROM user_groups ug
        JOIN groups g ON g.group_id = ug.group_id
        WHERE ug.user_id = $1 `, [user_id]);

    return result.rows;
}


export async function createGroup(group_name, group_owner, uuid) {

    const checkNameAvailable = await pool.query(`
    SELECT group_name from groups WHERE group_name = $1`, [group_name]);

    if(checkNameAvailable.rows.length !== 0){
        return{
            status: 409,
            message: 'Group name exists'
        }
    }

    const result = await pool.query(
        'INSERT INTO groups (group_id, group_name, group_owner) VALUES ($1, $2, $3) RETURNING *',
        [uuid, group_name, group_owner]
    );
    
    await pool.query('INSERT INTO user_groups (user_id, group_id, joined_at) VALUES ($1, $2, $3) RETURNING *', [group_owner, uuid, new Date()])

    const rooms = [{name: 'Room 1'},{name: 'Room 2'},{name: 'Room 3'},];

    for(const room of rooms){
        const roomId = generateUUID();
        await pool.query(`
            INSERT INTO groups_roomId (room_id, group_id, room_name, created_at) VALUES($1, $2, $3, $4) RETURNING *`, [roomId, uuid, room.name, new Date()]);
    }


    return result.rows[0];
}

export async function getMembers(group_id){
    const result = await pool.query(
       `SELECT u.user_id, u.username 
        FROM user_groups ug 
        JOIN users u ON u.user_id = ug.user_id
        WHERE ug.group_id = $1 `, [group_id]
    );

    const owner = await pool.query(
        'SELECT group_owner from groups WHERE group_id = $1',[group_id]
    )

    return {
        members: result.rows,
        owner: owner.rows[0]
    }

}

export async function getGroupsUserIsNotIn(userId){
    const result = await pool.query(
       `SELECT g.group_id, g.group_name
        FROM groups g
        WHERE g.group_id NOT IN (
            SELECT group_id FROM user_groups WHERE user_id = $1
        )`, [userId]
    );

    return result.rows;
}


export async function addUserToGroup(userId, groupId) {
    await pool.query(
        `INSERT INTO user_groups (user_id, group_id, joined_at)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [userId, groupId, new Date()]
    );
}

export async function getGroupOwner(group_id){
    const result = await pool.query(`
        SELECT group_owner FROM groups WHERE group_id = $1
        `, [group_id]);

    return result.rows[0];
}

export async function getGroupById(group_id){
    const result = await pool.query(`
        SELECT * FROM groups WHERE group_id = $1`, [group_id]);

    return result.rows[0];
}

export async function deleteGroup(group_id){
        await pool.query(`
            DELETE FROM user_groups WHERE group_id = $1`,[group_id]);


        await pool.query(`
            DELETE FROM groups WHERE group_id = $1`,[group_id]); 
            
        await pool.query(`
            DELETE FROM groups_roomId WHERE group_id = $1`, [group_id]);
}

export async function updateGroup(group_id, group_name){

    const check = await pool.query(`
        SELECT group_owner FROM groups WHERE group_id = $1`, [group_id]);

    if(check.rows.length === 0){
        throw new Error("Group not found");
    }

    const checkNameAvailable = await pool.query(`
        SELECT group_name from groups WHERE group_name = $1`, [group_name]);

     if(checkNameAvailable.rows.length !== 0){
        return{
            status: 409,
            message: 'Group name exists'
        }
    }

    const result = await pool.query(`
        UPDATE groups
        SET group_name = $1
        WHERE group_id = $2
        RETURNING *`,[group_name, group_id]);

    return result.rows[0];

}

export async function leaveGroup(group_id ,user_id){

    const check = await pool.query(`
        SELECT group_owner
        FROM groups
        WHERE group_id = $1`,[group_id]);

    if(check.rows.length === 0){
        throw new Error('Group not found');
    }
    

    const owner_id = check.rows[0].group_owner;

    console.log("group_id:", group_id, group_id.length);
    console.log("user_id:", user_id, user_id.length);
    console.log("owner_id:", owner_id, owner_id.length);


    if(owner_id === user_id){
        throw new Error('Owner cannot leave the group. Delete it instead.');
    }

    await pool.query(`
        DELETE FROM user_groups WHERE group_id = $1 AND user_id = $2   
        `, [group_id, user_id]);
}

export async function getRoomIds(group_id){

    const respone = await pool.query( `
    SELECT * FROM groups_roomid WHERE group_id = $1 ORDER BY created_at ASC`, [group_id]);


    return respone.rows;

}

export async function getRoomById(room_id){
    const response = await pool.query(`
        SELECT * FROM groups_roomid WHERE room_id = $1`,[room_id]);
    
    return response.rows[0];
}

export async function getGroupName(group_id){
    const response = await pool.query(`
        SELECT group_name from groups WHERE group_id = $1`, [group_id]);

    return response.rows[0];

}

export async function sendMessage(group_id, user_id, message, username){
    console.log("VSETKY VECI VYPISUJEM TU: ", group_id, '\n', user_id, '\n', username, '\n' ,message);
    console.log("USERNAME: ", username);
    console.log("message: ", message);
    const resposne = await pool.query(`
        INSERT INTO messages (message_id, group_id, user_id, username, message, time) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [generateUUID(), group_id, user_id, message, username, new Date()]);

    return resposne.rows[0];
}

export async function getMessages(group_id){
    const response = await pool.query(`
        SELECT message, time, username FROM messages WHERE group_id = $1 ORDER BY time ASC`, [group_id]);

    return response.rows;
}