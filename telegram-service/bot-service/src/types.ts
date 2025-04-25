/**
 * Type definitions for the Telegram bot service
 */

/**
 * Represents an IOU (I Owe You) entity in the system
 */
export interface IOU {
  id: string;
  issuerEmail: string;
  recipientEmail: string;
  amount: number;
  description: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
} 