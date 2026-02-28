import * as groupsModel from '../models/groups.model.js';

export async function ownerOnly(req, res, next) {
    try {
        const groupId = req.params.groupId;
        const userId = req.user.user_id;

        const group = await groupsModel.getGroupById(groupId);

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (group.group_owner !== userId) {
            return res.status(403).json({ message: "Only the owner can perform this action" });
        }

        next();
    } catch (err) {
        next(err);
    }
}
