import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { list, getByDate, upsert, remove, analyze } from './news.controller';

const router = Router();

// GET  /api/news              - 列表（分页）
router.get('/', asyncHandler(list));

// GET  /api/news/:date        - 按日期获取（支持 "today"）
router.get('/:date', asyncHandler(getByDate));

// POST /api/news              - 新增/更新新闻联播文本
router.post('/', asyncHandler(upsert));

// DELETE /api/news/:id        - 删除
router.delete('/:id', asyncHandler(remove));

// POST /api/news/:id/analyze  - AI 分析（SSE 流式）
router.post('/:id/analyze', analyze);

export default router;
