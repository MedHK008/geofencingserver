import { Router } from 'express';
import { getZonesWithAccidents } from '../controllers/calculateAccidents';

const router = Router();

router.get('/:city', getZonesWithAccidents);

export default router;