import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const isOperational = err instanceof AppError ? err.isOperational : false;

  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, {
    stack: err.stack,
    statusCode,
    isOperational
  });

  res.status(statusCode).json({
    status: 'error',
    message: isOperational ? err.message : 'Something went wrong on the server',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};
