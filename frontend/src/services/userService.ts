import api from './api';

export interface User {
    id?: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
}

// Cache the list of users to avoid frequent API calls
let userCache: User[] | null = null;

/**
 * Fetch all users from the system
 */
export const fetchUsers = async (): Promise<User[]> => {
    try {
        // Return cached users if available
        if (userCache !== null) {
            return userCache;
        }

        // Get auth token
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Not authenticated');
        }

        try {
            // Try to fetch users from the backend
            const response = await api.get('/backend/users');
            
            if (response.data && Array.isArray(response.data)) {
                const users = response.data.map((user: any) => ({
                    id: user.id || undefined,
                    email: user.email,
                    username: user.username || user.email.split('@')[0],
                    firstName: user.firstName,
                    lastName: user.lastName
                }));
                
                // Cache the results
                userCache = users;
                return users;
            }
        } catch (error) {
            console.warn('Could not fetch users from backend, using fallback list:', error);
        }
        
        // Fallback to hardcoded list if backend call fails
        const users: User[] = [
            { email: 'alice@tech.nd', username: 'alice' },
            { email: 'bob@tech.nd', username: 'bob' },
            { email: 'charlie@tech.nd', username: 'charlie' }
        ];
        
        // Cache the results
        userCache = users;
        
        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};

/**
 * Check if a user with the given email exists
 */
export const validateUserEmail = async (email: string): Promise<boolean> => {
    try {
        const users = await fetchUsers();
        return users.some(user => user.email.toLowerCase() === email.toLowerCase());
    } catch (error) {
        console.error('Error validating user email:', error);
        return false;
    }
};

/**
 * Get available user suggestions for the IOU form
 */
export const getUserSuggestions = async (searchTerm: string = ''): Promise<User[]> => {
    try {
        const users = await fetchUsers();
        
        if (!searchTerm) {
            return users;
        }
        
        // Filter users by search term
        const searchLower = searchTerm.toLowerCase();
        return users.filter(user => 
            user.email.toLowerCase().includes(searchLower) || 
            user.username.toLowerCase().includes(searchLower)
        );
    } catch (error) {
        console.error('Error getting user suggestions:', error);
        return [];
    }
};

// Allow clearing the cache when needed (e.g., after login/logout)
export const clearUserCache = () => {
    userCache = null;
}; 