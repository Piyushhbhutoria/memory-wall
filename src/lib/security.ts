import DOMPurify from 'dompurify';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

// Enhanced security patterns for XSS detection
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<link.*rel\s*=\s*["']stylesheet/gi,
  /expression\s*\(/gi,
  /vbscript:/gi,
  /data:text\/html/gi
];

// Enhanced input validation schemas
export const memoryContentSchema = z.object({
  content: z.string()
    .max(2000, 'Content must be less than 2000 characters')
    .refine(val => !hasXSSContent(val), 'Content contains potentially harmful scripts'),
  authorName: z.string()
    .min(1, 'Author name is required')
    .max(50, 'Author name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_\u00C0-\u017F]+$/, 'Author name contains invalid characters')
    .refine(val => !hasXSSContent(val), 'Name contains potentially harmful content'),
  type: z.enum(['text', 'image', 'video', 'sketch'])
});

export const commentSchema = z.object({
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(500, 'Comment must be less than 500 characters')
    .refine(val => !hasXSSContent(val), 'Comment contains potentially harmful scripts'),
  authorName: z.string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_\u00C0-\u017F]+$/, 'Name contains invalid characters')
    .refine(val => !hasXSSContent(val), 'Name contains potentially harmful content')
});

export const wallSchema = z.object({
  name: z.string()
    .min(1, 'Wall name is required')
    .max(100, 'Wall name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_'.!?\u00C0-\u017F]+$/, 'Wall name contains invalid characters')
    .refine(val => !hasXSSContent(val), 'Wall name contains potentially harmful content')
});

// Password strength validation schema
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Enhanced XSS detection
const hasXSSContent = (content: string): boolean => {
  return XSS_PATTERNS.some(pattern => pattern.test(content));
};

// Content sanitization
export const sanitizeContent = (content: string): string => {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u'],
    ALLOWED_ATTR: []
  });
};

// Enhanced file validation with security monitoring
export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 20 * 1024 * 1024; // 20MB
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime'
  ];

  // Enhanced file name validation
  const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
  const hasSuspiciousExtension = suspiciousExtensions.some(ext => 
    file.name.toLowerCase().includes(ext)
  );

  if (hasSuspiciousExtension) {
    logSecurityEvent('suspicious_file_upload', `Suspicious file extension detected: ${file.name}`);
    return { isValid: false, error: 'File contains suspicious extension and cannot be uploaded.' };
  }

  if (file.size > maxSize) {
    logSecurityEvent('file_size_exceeded', `File size ${file.size} exceeds limit for ${file.name}`);
    return { isValid: false, error: 'File size must be less than 20MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    logSecurityEvent('invalid_file_type', `Invalid file type ${file.type} for ${file.name}`);
    return { isValid: false, error: 'File type not allowed. Only images and videos are permitted.' };
  }

  // Check for double extensions (e.g., file.jpg.exe)
  const parts = file.name.split('.');
  if (parts.length > 2) {
    logSecurityEvent('double_extension_detected', `Double extension detected: ${file.name}`);
    return { isValid: false, error: 'Files with multiple extensions are not allowed.' };
  }

  return { isValid: true };
};

// Enhanced rate limiting with security monitoring
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs = 60000; // 1 minute
  private readonly maxRequests = 10; // 10 requests per minute
  private readonly suspiciousThreshold = 20; // 20 requests triggers monitoring

  isAllowed(identifier: string, action: string = 'general'): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Clean old requests
    const validRequests = userRequests.filter(time => now - time < this.windowMs);
    
    // Check for suspicious activity
    if (validRequests.length >= this.suspiciousThreshold) {
      logSecurityEvent('suspicious_rate_limit', `High request rate detected: ${validRequests.length} requests`, identifier);
    }
    
    if (validRequests.length >= this.maxRequests) {
      logSecurityEvent('rate_limit_exceeded', `Rate limit exceeded for action: ${action}`, identifier);
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }

  // Get current request count for monitoring
  getCurrentCount(identifier: string): number {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    return userRequests.filter(time => now - time < this.windowMs).length;
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
    ctx.fillText('Wish Wall Security', 2, 15);
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

// Security event logging
export const logSecurityEvent = async (
  eventType: string,
  description: string,
  fingerprint?: string,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    // Call the database function for logging
    await supabase.rpc('log_security_event', {
      event_type: eventType,
      description,
      user_fingerprint: fingerprint || null,
      metadata: metadata ? JSON.stringify(metadata) : null
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

// Enhanced content sanitization with monitoring
export const sanitizeContentEnhanced = (content: string, context: string = 'general'): string => {
  const originalLength = content.length;
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u'],
    ALLOWED_ATTR: []
  });
  
  // Log if content was modified during sanitization
  if (sanitized.length !== originalLength || sanitized !== content) {
    logSecurityEvent('content_sanitized', `Content sanitized in context: ${context}`, undefined, {
      original_length: originalLength,
      sanitized_length: sanitized.length,
      context
    });
  }
  
  return sanitized;
};

// Password strength checker
export const checkPasswordStrength = (password: string): {
  isStrong: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push('Use at least 8 characters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Add numbers');

  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else feedback.push('Add special characters');

  if (password.length >= 12) score += 1;

  return {
    isStrong: score >= 4,
    score,
    feedback
  };
};
