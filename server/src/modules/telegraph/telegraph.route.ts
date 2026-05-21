import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { list, stream, aiContext } from './telegraph.controller';

const router = Router();

router.get('/', asyncHandler(list));           // 列表（分页）
router.get('/stream', stream);                 // SSE 实时推送（不走 asyncHandler）
router.get('/ai-context', asyncHandler(aiContext)); // AI 分析用

export default router;
