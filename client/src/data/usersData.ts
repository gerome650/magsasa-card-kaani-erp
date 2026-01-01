// User roles in the MAGSASA-CARD system
export type UserRole = 'farmer' | 'manager' | 'field_officer' | 'supplier' | 'admin';

// User interface
export interface User {
  id: string;
  username: string; // Username for login
  email: string;
  password: string; // In production, this would be hashed
  name: string;
  role: UserRole;
  phone: string;
  location?: string;
  farmerId?: string; // Link to farmer profile if role is 'farmer'
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

// Demo users for each role
export const demoUsers: User[] = [
  // Farmer users
  {
    id: 'U001',
    username: 'farmer',
    email: 'juan.delacruz@example.com',
    password: 'demo123',
    name: 'Juan dela Cruz',
    role: 'farmer',
    phone: '+63 917 123 4567',
    location: 'Brgy. San Juan, Calauan, Laguna',
    farmerId: 'F001',
    createdAt: '2023-01-15',
    lastLogin: '2024-11-16'
  },

  
  // Field Officer users
  {
    id: 'U002',
    username: 'officer',
    email: 'maria.santos@magsasa.org',
    password: 'demo123',
    name: 'Maria Santos',
    role: 'field_officer',
    phone: '+63 919 345 6789',
    location: 'CARD BDSFI - Laguna Branch',
    createdAt: '2022-06-10',
    lastLogin: '2024-11-16'
  },

  
  // Manager users
  {
    id: 'U003',
    username: 'manager',
    email: 'roberto.garcia@magsasa.org',
    password: 'demo123',
    name: 'Roberto Garcia',
    role: 'manager',
    phone: '+63 921 567 8901',
    location: 'CARD BDSFI - Regional Office',
    createdAt: '2021-03-01',
    lastLogin: '2024-11-16'
  }
];

// Helper function to find user by email
export const findUserByEmail = (email: string): User | undefined => {
  return demoUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
};

// Helper function to find user by username
export const findUserByUsername = (username: string): User | undefined => {
  return demoUsers.find(user => user.username.toLowerCase() === username.toLowerCase());
};

// Helper function to authenticate user (supports both username and email)
export const authenticateUser = (usernameOrEmail: string, password: string): User | null => {
  // Try username first, then email
  let user = findUserByUsername(usernameOrEmail);
  if (!user) {
    user = findUserByEmail(usernameOrEmail);
  }
  
  if (user && user.password === password) {
    return { ...user, lastLogin: new Date().toISOString() };
  }
  return null;
};

// Helper function to get users by role
export const getUsersByRole = (role: UserRole): User[] => {
  return demoUsers.filter(user => user.role === role);
};
