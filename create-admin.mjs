import { hashPassword } from './src/auth.js';

const password = 'Admin123!';
const hash = await hashPassword(password);

console.log('Password hash for admin:');
console.log(hash);