export function updateGroupSchema(req) {

    const { group_name } = req.body;

    if(!group_name) return 'Group name must be specified';
    if(typeof group_name !== 'string' || group_name.length < 3) return 'Group name must be a string with at least 3 characters.';

    return null;
}