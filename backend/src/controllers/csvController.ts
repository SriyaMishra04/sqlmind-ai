import { Request, Response, NextFunction } from 'express';
import { csvService } from '../services/csvService';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class CSVController {
  /**
   * Import CRM records from uploaded CSV
   */
  public importCSV = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new AppError('No CSV file uploaded. Please upload a valid CSV file.', 400);
      }

      logger.info(`CSV Controller: Received CSV file upload: ${req.file.originalname} (${req.file.size} bytes)`);

      // Retrieve batch size from query if specified, default to 50
      const batchSize = req.body.batchSize ? parseInt(req.body.batchSize, 10) : 50;

      const result = await csvService.processCSV(req.file.path, batchSize);

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}

export const csvController = new CSVController();
export default csvController;
