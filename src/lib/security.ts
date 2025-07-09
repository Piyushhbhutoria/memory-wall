import DOMPurify from 'dompurify';
import { z } from 'zod';

// Input validation schemas
export const memoryContentSchema = z.object({
  content: z.string()
    .max(2000, 'Content must be less than 2000 characters')
    .refine(val => !val.includes('<script'), 'Invalid content'),
  authorName: z.string()
    .min(1, 'Author name is required')
    .max(50, 'Author name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Author name contains invalid characters'),
  type: z.enum(['text', 'image', 'video', 'sketch'])
});

export const commentSchema = z.object({
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(500, 'Comment must be less than 500 characters')
    .refine(val => !val.includes('<script'), 'Invalid content'),
  authorName: z.string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name contains invalid characters')
});

export const wallSchema = z.object({
  name: z.string()
    .min(1, 'Wall name is required')
    .max(100, 'Wall name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_'.!?]+$/, 'Wall name contains invalid characters')
});

// Content sanitization
export const sanitizeContent = (content: string): string => {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u'],
    ALLOWED_ATTR: []
  });
};

// File validation
export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 20 * 1024 * 1024; // 20MB
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime'
  ];

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 20MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'File type not allowed. Only images and videos are permitted.' };
  }

  return { isValid: true };
};

// Rate limiting (memory-based for simplicity)
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs = 60000; // 1 minute
  private readonly maxRequests = 10; // 10 requests per minute

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Clean old requests
    const validRequests = userRequests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }
}

export const rateLimiter = new RateLimiter();

// Enhanced fingerprinting
export const generateSecureFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let canvasFingerprint = '';
  
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Wallable Security', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Fingerprint Test', 4, 45);
    canvasFingerprint = canvas.toDataURL();
  }
  
  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.languages?.join(',') || '',
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.platform,
    navigator.cookieEnabled,
    navigator.doNotTrack || '',
    canvasFingerprint,
    // Add more entropy
    navigator.hardwareConcurrency || 0,
    navigator.maxTouchPoints || 0,
    window.devicePixelRatio || 1
  ].join('|');
  
  // Create a more robust hash
  let hash = 0;
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Add timestamp-based salt for session uniqueness
  const sessionSalt = Math.floor(Date.now() / 3600000); // Changes every hour
  hash = hash ^ sessionSalt;
  
  return Math.abs(hash).toString(36) + Date.now().toString(36).slice(-4);
};