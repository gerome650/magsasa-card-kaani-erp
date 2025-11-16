// User roles in the MAGSASA-CARD system
export type UserRole = 'farmer' | 'manager' | 'field_officer';

// User interface
export interface User {
  id: string;
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
    email: 'maria.santos@farmer.com',
    password: 'farmer123', // Demo password
    name: 'Maria Santos',
    role: 'farmer',
    phone: '+63 917 123 4567',
    location: 'Brgy. San Juan, Calauan, Laguna',
    farmerId: 'F001',
    createdAt: '2023-01-15',
    lastLogin: '2024-11-16'
  },
  {
    id: 'U002',
    email: 'juan.delacruz@farmer.com',
    password: 'farmer123',
    name: 'Juan Dela Cruz',
    role: 'farmer',
    phone: '+63 918 234 5678',
    location: 'Brgy. Dayap, Los Baños, Laguna',
    farmerId: 'F002',
    createdAt: '2023-02-20',
    lastLogin: '2024-11-15'
  },
  
  // Field Officer users
  {
    id: 'U003',
    email: 'pedro.garcia@fieldofficer.com',
    password: 'officer123',
    name: 'Pedro Garcia',
    role: 'field_officer',
    phone: '+63 919 345 6789',
    location: 'CARD BDSFI - Laguna Branch',
    createdAt: '2022-06-10',
    lastLogin: '2024-11-16'
  },
  {
    id: 'U004',
    email: 'ana.reyes@fieldofficer.com',
    password: 'officer123',
    name: 'Ana Reyes',
    role: 'field_officer',
    phone: '+63 920 456 7890',
    location: 'CARD BDSFI - Laguna Branch',
    createdAt: '2022-08-15',
    lastLogin: '2024-11-15'
  },
  
  // Manager users
  {
    id: 'U005',
    email: 'carlos.ramos@manager.com',
    password: 'manager123',
    name: 'Carlos Ramos',
    role: 'manager',
    phone: '+63 921 567 8901',
    location: 'CARD BDSFI - Regional Office',
    createdAt: '2021-03-01',
    lastLogin: '2024-11-16'
  },
  {
    id: 'U006',
    email: 'elena.torres@manager.com',
    password: 'manager123',
    name: 'Elena Torres',
    role: 'manager',
    phone: '+63 922 678 9012',
    location: 'CARD BDSFI - Regional Office',
    createdAt: '2021-05-20',
    lastLogin: '2024-11-16'
  }
];

// Helper function to find user by email
export const findUserByEmail = (email: string): User | undefined => {
  return demoUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
};

// Helper function to authenticate user
export const authenticateUser = (email: string, password: string): User | null => {
  const user = findUserByEmail(email);
  if (user && user.password === password) {
    return { ...user, lastLogin: new Date().toISOString() };
  }
  return null;
};

// Helper function to get users by role
export const getUsersByRole = (role: UserRole): User[] => {
  return demoUsers.filter(user => user.role === role);
};
