import { Router } from 'express';
import { csvController } from '../controllers/csvController';
import { upload } from '../middleware/upload';

const router = Router();

// Endpoint for CSV Import
router.post('/import', upload.single('file'), csvController.importCSV);

export default router;
