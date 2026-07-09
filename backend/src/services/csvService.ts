import fs from 'fs';
import Papa from 'papaparse';
import { z } from 'zod';
import { CRMLead, ImportResponse, ProcessedRecord } from '../types/csv';
import { aiService } from './aiService';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

// Validation Schema for CRM Leads
const LeadValidationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address')
});

export class CSVService {
  /**
   * Processes a CSV file, performs batch AI mapping, validates leads, and returns stats.
   * @param filePath Path to the uploaded CSV file
   * @param batchSize Number of records to send to AI extraction at once
   */
  public async processCSV(filePath: string, batchSize: number = 50): Promise<ImportResponse> {
    const startTime = Date.now();
    logger.info(`CSV Service: Starting CSV processing for file ${filePath}`);

    if (!fs.existsSync(filePath)) {
      throw new AppError('CSV file not found', 404);
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Parse CSV using PapaParse
      const parseResult = Papa.parse<Record<string, string>>(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false
      });

      if (parseResult.errors.length > 0) {
        logger.warn(`CSV Service: PapaParse reported errors during parsing:`, parseResult.errors);
      }

      const rawRows = parseResult.data;
      logger.info(`CSV Service: Parsed ${rawRows.length} rows from CSV`);

      if (rawRows.length === 0) {
        return {
          records: [],
          skipped: [],
          stats: {
            totalImported: 0,
            totalSkipped: 0,
            processingTimeMs: Date.now() - startTime
          }
        };
      }

      const importedLeads: CRMLead[] = [];
      const skippedLeads: { rowNumber: number; reason: string; originalData: Record<string, string> }[] = [];

      // Process in batches
      for (let i = 0; i < rawRows.length; i += batchSize) {
        const batch = rawRows.slice(i, i + batchSize);
        logger.info(`CSV Service: Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(rawRows.length / batchSize)}`);

        // Send to AI service (intelligent mapping)
        const extractedCRMLeads = await aiService.extractCRMLeads(batch);

        // Validate each extracted lead
        extractedCRMLeads.forEach((lead, index) => {
          const originalRowIndex = i + index + 1; // 1-indexed for sheets/users
          const originalRow = batch[index];

          // Validate using Zod
          const validation = LeadValidationSchema.safeParse(lead);

          if (validation.success) {
            importedLeads.push(lead);
          } else {
            // Collect validation failure messages
            const errors = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
            skippedLeads.push({
              rowNumber: originalRowIndex,
              reason: errors,
              originalData: originalRow
            });
            logger.warn(`CSV Service: Skipped row ${originalRowIndex} due to: ${errors}`);
          }
        });
      }

      // Calculate statistics
      const processingTimeMs = Date.now() - startTime;
      const stats = {
        totalImported: importedLeads.length,
        totalSkipped: skippedLeads.length,
        processingTimeMs
      };

      logger.info(`CSV Service: Completed processing. Stats: ${JSON.stringify(stats)}`);

      return {
        records: importedLeads,
        skipped: skippedLeads,
        stats
      };
    } catch (error: any) {
      logger.error(`CSV Service: Error processing CSV: ${error.message}`, error);
      throw new AppError(`Failed to process CSV file: ${error.message}`, 500);
    } finally {
      // Clean up uploaded file
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          logger.info(`CSV Service: Cleaned up temporary file ${filePath}`);
        }
      } catch (cleanupErr: any) {
        logger.error(`CSV Service: Failed to delete file ${filePath}: ${cleanupErr.message}`);
      }
    }
  }
}

export const csvService = new CSVService();
export default csvService;
