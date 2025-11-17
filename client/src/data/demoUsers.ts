export interface DemoUser {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  role: 'Farmer' | 'Field Officer' | 'Manager';
  farmerId?: string; // For farmer role
}

export const demoUsers: DemoUser[] = [
  {
    id: 'user-farmer-001',
    username: 'farmer',
    password: 'demo123',
    name: 'Juan dela Cruz',
    email: 'juan.delacruz@example.com',
    role: 'Farmer',
    farmerId: 'F001', // Links to existing farmer in demo data
  },
  {
    id: 'user-officer-001',
    username: 'officer',
    password: 'demo123',
    name: 'Maria Santos',
    email: 'maria.santos@magsasa.org',
    role: 'Field Officer',
  },
  {
    id: 'user-manager-001',
    username: 'manager',
    password: 'demo123',
    name: 'Roberto Garcia',
    email: 'roberto.garcia@magsasa.org',
    role: 'Manager',
  },
];

/**
 * Validate demo user credentials
 * @param username - Username to validate
 * @param password - Password to validate
 * @returns User object if valid, null otherwise
 */
export function validateDemoCredentials(
  username: string,
  password: string
): DemoUser | null {
  const user = demoUsers.find(
    (u) => u.username === username && u.password === password
  );
  return user || null;
}

/**
 * Get demo user by ID
 * @param id - User ID
 * @returns User object if found, null otherwise
 */
export function getDemoUserById(id: string): DemoUser | null {
  return demoUsers.find((u) => u.id === id) || null;
}
