
import { randomBytes } from "crypto";

export const crypto = {
  hash: async (password: string): Promise<string> => {
    const { pbkdf2 } = await import('node:crypto');
    const { promisify } = await import('node:util');
    const pbkdf2Async = promisify(pbkdf2);
    const salt = randomBytes(16);
    const iterations = 1000;
    const keylen = 64;
    const digest = 'sha512';
    const derivedKey = await pbkdf2Async(password, salt, iterations, keylen, digest);
    return `${salt.toString('hex')}:${iterations}:${derivedKey.toString('hex')}`;
  },

  compare: async (password: string, hash: string): Promise<boolean> => {
    const { pbkdf2 } = await import('node:crypto');
    const { promisify } = await import('node:util');
    const pbkdf2Async = promisify(pbkdf2);
    const [saltHex, iterations, keyHex] = hash.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const derivedKey = await pbkdf2Async(password, salt, parseInt(iterations), 64, 'sha512');
    return derivedKey.toString('hex') === keyHex;
  },

  generateEventId: (): string => {
    return randomBytes(8)
      .toString('base64')
      .replace(/[+/=]/g, '')  // Remove non-alphanumeric chars
      .substring(0, 13);      // Ensure exactly 13 chars
  }
};

import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};
