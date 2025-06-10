import express from 'express';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
console.log('Loaded DATABASE_URL:', process.env.DATABASE_URL);
// import cookieParser from 'cookieParser';
import cors from 'cors';
import authRouter from './routes/auth'; // Import the router
import evalRouter from "./routes/eval";

const app = express();
const clientURLs = [
  `http://localhost:5173`,
  // REMOVE THIS ONE after testing
  `https://*.ngrok-free.app`,
];

app.use(cors({
  credentials: true,
  origin: clientURLs,
}));
const PORT = 3001;

const PgSession = pgSession(session);

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.set(`trust proxy`, 1);

export const sessionMiddleware = session({
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: `none`,
    secure: true, // process.env.NODE_ENV === `production`
  },
  resave: false,
  saveUninitialized: false,
  secret: process.env.SESSION_SECRET || `development-secret`,
  store: new PgSession({
    createTableIfMissing: true,
    pool: pgPool,
    tableName: `user_sessions`,
  }),
});

app.get(`/`, (_req, res) => {
  res.send(`Welcome from TypeScript backend!`);
});
app.use(express.json()); // Use JSON middleware you slugs
app.use(sessionMiddleware); // Session storage
app.use(authRouter);
app.use(evalRouter);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is running on http://localhost:${ PORT }`);
});
