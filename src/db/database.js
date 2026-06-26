import { LowSync } from 'lowdb';
import { JSONFileSync } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');

mkdirSync(DATA_DIR, { recursive: true });

const defaultData = {
  orders: [],      // Razorpay payments / enrollments
  users: [],       // Enrolled users
  contacts: [],    // Contact form submissions
};

const adapter = new JSONFileSync(join(DATA_DIR, 'db.json'));
const db = new LowSync(adapter, defaultData);

db.read();

export default db;
