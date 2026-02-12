import { User } from '../types';

const MOCK_USERS: User[] = [
    {
        id: 'u-admin',
        name: 'Admin User',
        email: 'admin@globalworkforce.com',
        role: 'Admin',
        avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0F172A&color=fff',
        lastLogin: new Date().toISOString()
    },
    {
        id: 'u-recruiter',
        name: 'Sarah Connor',
        email: 'sarah@globalworkforce.com',
        role: 'Recruiter',
        avatar: 'https://ui-avatars.com/api/?name=Sarah+Connor&background=2563EB&color=fff',
        lastLogin: new Date().toISOString()
    },
    {
        id: 'u-viewer',
        name: 'Guest Viewer',
        email: 'guest@globalworkforce.com',
        role: 'Viewer',
        avatar: 'https://ui-avatars.com/api/?name=Guest+Viewer&background=64748B&color=fff',
        lastLogin: new Date().toISOString()
    }
];

export class AuthService {
    private static STORAGE_KEY = 'globalworkforce_auth_user';

    static login(email: string, password: string): Promise<User> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Mock simple password check
                if (password === 'admin123' || password === 'demo123') {
                    const user = MOCK_USERS.find(u => u.email === email);
                    if (user) {
                        this.saveSession(user);
                        resolve(user);
                    } else {
                        reject(new Error('User not found. Try admin@globalworkforce.com'));
                    }
                } else {
                    reject(new Error('Invalid password. (Hint: admin123)'));
                }
            }, 800); // Simulate network delay
        });
    }

    static logout(): Promise<void> {
        return new Promise((resolve) => {
            localStorage.removeItem(this.STORAGE_KEY);
            setTimeout(resolve, 500);
        });
    }

    static getCurrentUser(): User | null {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (!stored) return null;
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse user session', e);
            localStorage.removeItem(this.STORAGE_KEY);
            return null;
        }
    }

    static isAuthenticated(): boolean {
        return !!this.getCurrentUser();
    }

    private static saveSession(user: User) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    }
}
