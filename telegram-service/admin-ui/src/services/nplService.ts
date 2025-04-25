import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12000';
const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:11000';
const REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'nplintegrations';
const CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'nplintegrations';

// Interface for IOU
interface IOU {
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
}

// Interface for User stats
interface UserStats {
  totalUsers: number;
  activeUsers: number;
}

// Interface for Workflow stats
interface WorkflowStats {
  totalWorkflows: number;
  activeWorkflows: number;
  completedWorkflows: number;
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
   * Get all IOUs
   */
  async getAllIOUs(token: string): Promise<IOU[]> {
    try {
      const response = await axios({
        method: 'GET',
        url: `${API_URL}/api/protocols/iou.IOU`,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching IOUs:', error);
      throw new Error('Failed to fetch IOUs');
    }
  },

  /**
   * Get user statistics
   */
  async getUserStats(token: string): Promise<UserStats> {
    // This would be a real API call in a production environment
    // For now, we'll return mock data
    return {
      totalUsers: 10,
      activeUsers: 5,
    };
  },

  /**
   * Get workflow statistics
   */
  async getWorkflowStats(token: string): Promise<WorkflowStats> {
    // This would be a real API call in a production environment
    // For now, we'll return mock data
    return {
      totalWorkflows: 15,
      activeWorkflows: 8,
      completedWorkflows: 7,
    };
  },

  /**
   * Get registered Telegram users
   */
  async getTelegramUsers(token: string): Promise<any[]> {
    // This would be a real API call in a production environment
    // For now, we'll return mock data
    return [
      { id: 1, telegramId: '12345', name: 'Alice', email: 'alice@example.com', registeredAt: new Date() },
      { id: 2, telegramId: '67890', name: 'Bob', email: 'bob@example.com', registeredAt: new Date() },
    ];
  },
}; 