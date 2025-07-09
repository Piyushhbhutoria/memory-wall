import { useState, useEffect } from 'react';
import { generateSecureFingerprint } from '@/lib/security';

// Enhanced browser fingerprinting for anonymous users
export const useFingerprint = () => {
  const [fingerprint, setFingerprint] = useState<string>('');

  useEffect(() => {
    setFingerprint(generateSecureFingerprint());
  }, []);

  return fingerprint;
};