import { Router } from 'express';
import * as controller from './user.controller';
import { validate } from '@/middleware/validate.middleware';
import { auth } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/utils/asyncHandler';
import { loginSchema, registerSchema } from './user.schema';

const router = Router();

// 公开接口
router.post('/login', validate(loginSchema), asyncHandler(controller.login));
router.post('/register', validate(registerSchema), asyncHandler(controller.register));

// 需要登录
router.get('/profile', auth(), asyncHandler(controller.getProfile));

// 仅管理员
router.get('/list', auth(['admin']), asyncHandler(controller.listUsers));

export default router;
