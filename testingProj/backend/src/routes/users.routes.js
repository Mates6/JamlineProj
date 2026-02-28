import { Router } from "express";
import * as usersController from "../controllers/user.controller.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get('/getAllUsers', usersController.getAllUsers);


//router.get('/profile', authRequired, usersController.getProfile);

export default router;  