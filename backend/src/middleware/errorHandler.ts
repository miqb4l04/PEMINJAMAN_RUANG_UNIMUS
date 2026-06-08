import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`🚨 [SERVER ERROR]:`, err.message || err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Terjadi kesalahan internal pada server.';

  res.status(statusCode).json({
    error: message,
    // Stack trace hanya ditampilkan saat mode development untuk proses debugging
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};