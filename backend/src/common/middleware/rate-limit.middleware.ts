import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private store: RateLimitStore = {};
  private windowMs = 15 * 60 * 1000; // 15 minutes
  private maxRequests = 100; // 100 requests per window

  use(req: Request, res: Response, next: NextFunction) {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    // Initialize or get existing record
    if (!this.store[key]) {
      this.store[key] = { count: 0, resetTime: now + this.windowMs };
    }

    // Reset if window has passed
    if (now > this.store[key].resetTime) {
      this.store[key] = { count: 0, resetTime: now + this.windowMs };
    }

    // Increment request count
    this.store[key].count++;

    // Check if limit exceeded
    if (this.store[key].count > this.maxRequests) {
      return res.status(429).json({
        statusCode: 429,
        message: 'Too many requests, please try again later.',
      });
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', this.maxRequests);
    res.setHeader('X-RateLimit-Remaining', this.maxRequests - this.store[key].count);
    res.setHeader('X-RateLimit-Reset', new Date(this.store[key].resetTime).toISOString());

    next();
  }
}
