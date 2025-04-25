import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// API endpoints
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:11000';
const NPL_ENGINE_URL = process.env.NPL_ENGINE_URL || 'http://localhost:12000';
const REALM = process.env.KEYCLOAK_REALM || 'nplintegrations';
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'nplintegrations';

// Interface for IOU
export interface IOU {
  '@id': string;
  description: string;
  forAmount: number;
  '@state': string;
  '@parties': {
    issuer: {
      entity: {
        email: string[];
      };
    };
    payee: {
      entity: {
        email: string[];
      };
    };
  };
  status?: string;
  amount?: number;
  issuerEmail?: string;
  recipientEmail?: string;
}

/**
 * Service for interacting with the NPL Engine API
 */
export const nplService = {
  /**
   * Authenticate a user with Keycloak
   */
  async authenticate(username: string, password: string): Promise<string> {
    try {
      const response = await axios({
        method: 'POST',
        url: `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: new URLSearchParams({
          grant_type: 'password',
          client_id: CLIENT_ID,
          username,
          password,
        }),
      });

      return response.data.access_token;
    } catch (error) {
      console.error('Authentication error:', error);
      throw new Error('Authentication failed');
    }
  },

  /**
   * Create a new IOU
   */
  async createIOU(
    token: string, 
    recipient: string, 
    amount: number, 
    description: string
  ): Promise<void> {
    try {
      await axios({
        method: 'POST',
        url: `${NPL_ENGINE_URL}/api/protocols/iou.IOU`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        data: {
          description,
          forAmount: amount,
          '@parties': {
            issuer: {
              entity: {
                // The issuer is the authenticated user
              },
              access: {}
            },
            payee: {
              entity: {
                email: [recipient],
              },
              access: {}
            }
          }
        },
      });
    } catch (error) {
      console.error('Error creating IOU:', error);
      throw new Error('Failed to create IOU');
    }
  },

  /**
   * Get IOUs for the current user
   */
  async getMyIOUs(token: string): Promise<IOU[]> {
    try {
      const response = await axios({
        method: 'GET',
        url: `${NPL_ENGINE_URL}/api/protocols/iou.IOU`,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Transform the response to make it easier to use
      return response.data.map((iou: IOU) => {
        return {
          ...iou,
          status: iou['@state'],
          amount: iou.forAmount,
          issuerEmail: iou['@parties']?.issuer?.entity?.email?.[0] || 'Unknown',
          recipientEmail: iou['@parties']?.payee?.entity?.email?.[0] || 'Unknown',
        };
      });
    } catch (error) {
      console.error('Error fetching IOUs:', error);
      throw new Error('Failed to fetch IOUs');
    }
  },

  /**
   * Pay an IOU
   */
  async payIOU(token: string, iouId: string, amount: number): Promise<void> {
    try {
      await axios({
        method: 'POST',
        url: `${NPL_ENGINE_URL}/api/protocols/iou.IOU/${iouId}/pay`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        data: {
          amount,
        },
      });
    } catch (error) {
      console.error('Error paying IOU:', error);
      throw new Error('Failed to pay IOU');
    }
  },

  /**
   * Forgive an IOU
   */
  async forgiveIOU(token: string, iouId: string): Promise<void> {
    try {
      await axios({
        method: 'POST',
        url: `${NPL_ENGINE_URL}/api/protocols/iou.IOU/${iouId}/forgive`,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error forgiving IOU:', error);
      throw new Error('Failed to forgive IOU');
    }
  },
}; 