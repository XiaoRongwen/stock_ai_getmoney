import { Router } from 'express';
import { analyze } from './ai.controller';
import { getReport, generateReport } from './daily-report.controller';
import { asyncHandler } from '@/utils/asyncHandler';

const router = Router();

// POST /api/ai/analyze - 单条电报 AI 解读（流式）
router.post('/analyze', analyze);

// GET  /api/ai/daily-report          - 获取今日分析
router.get('/daily-report', asyncHandler(getReport));

// POST /api/ai/daily-report/generate - 生成今日分析（幂等）
router.post('/daily-report/generate', asyncHandler(generateReport));

export default router;
