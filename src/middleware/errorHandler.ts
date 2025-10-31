import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errorClasses.js';

interface ErrorResponse {
  success: boolean;
  message: string;
  error?: string;
  stack?: string;
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let isOperational = false;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
    isOperational = true;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    isOperational = true;
  } else if ((err as any).code === 11000) {
    statusCode = 409;
    const field = Object.keys((err as any).keyPattern || {})[0];
    message = field ? `${field} already exists` : 'Duplicate field value';
    isOperational = true;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    isOperational = true;
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    isOperational = true;
  } else if (err.message) {
    message = err.message;
  }

  const errorResponse: ErrorResponse = {
    success: false,
    message,
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = err.message;
    errorResponse.stack = err.stack;
  }

  if (!isOperational) {
    console.error('ERROR:', err);
  }

  res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};
