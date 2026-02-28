import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validators/auth.js";


const router = Router();


router.post('/login', validate(loginSchema), authController.login);

router.post('/register', validate(registerSchema), authController.register);

//ked access token expiroval, pouzije sa refresh token na ziskanie noveho access tokenu
router.post('/refreshToken', authController.refreshToken);

router.post('/logout', authController.logout);

export default router;