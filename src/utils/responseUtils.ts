import { Response } from 'express';

export function successResponse(res: Response, data: any, message: string = 'Success', statusCode: number = 200): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function errorResponse(res: Response, error: string | Error, statusCode: number = 500): Response {
  return res.status(statusCode).json({
    success: false,
    error: typeof error === 'string' ? error : error.message,
  });
}

export function validationErrorResponse(res: Response, errors: any): Response {
  return res.status(400).json({
    success: false,
    errors,
  });
}

export function unauthorizedResponse(res: Response, message: string = 'Unauthorized'): Response {
  return res.status(401).json({
    success: false,
    error: message,
  });
}

export function notFoundResponse(res: Response, message: string = 'Resource not found'): Response {
  return res.status(404).json({
    success: false,
    error: message,
  });
}
