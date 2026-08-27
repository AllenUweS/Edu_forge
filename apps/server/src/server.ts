import { app } from './app.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`[EduForge Express Server] Running on http://localhost:${PORT}`);
});
