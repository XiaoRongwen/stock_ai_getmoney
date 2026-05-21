import { Router } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { getIndices } from './indices.controller';

const router = Router();

router.get('/', asyncHandler(getIndices));

export default router;
