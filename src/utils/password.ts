// src/utils/password.ts
import bcrypt from 'bcryptjs'
import { PasswordValidation } from '../types/auth'

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12')

export class PasswordService {
  /**
   * Hash a password
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS)
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): PasswordValidation {
    const errors: string[] = []

    if (!password) {
      errors.push('Password is required')
      return { isValid: false, errors }
    }

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (password.length > 128) {
      errors.push('Password must be no more than 128 characters long')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password', 'password123', '123456', '123456789', 'qwerty',
      'abc123', 'password1', 'admin', 'letmein', 'welcome'
    ]

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a stronger password')
    }

    // Check for sequential characters
    if (/123456|abcdef|qwerty/.test(password.toLowerCase())) {
      errors.push('Password should not contain sequential characters')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Generate a random password
   */
  static generateRandomPassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    const allChars = lowercase + uppercase + numbers + symbols
    
    let password = ''
    
    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += symbols[Math.floor(Math.random() * symbols.length)]
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)]
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }

  /**
   * Check if password has been compromised (simple check)
   */
  static isPasswordCompromised(password: string): boolean {
    // This is a simple implementation. In production, you might want to
    // integrate with services like HaveIBeenPwned API
    const commonCompromisedPasswords = [
      'password', '123456', '123456789', 'password123', 'admin',
      'qwerty', 'abc123', 'password1', 'letmein', 'welcome',
      'monkey', '1234567890', 'dragon', 'princess', 'football'
    ]

    return commonCompromisedPasswords.includes(password.toLowerCase())
  }
}