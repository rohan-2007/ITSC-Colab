import express from 'express';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
// import cookieParser from 'cookieParser';
import cors from 'cors';
import authRouter from './routes/auth'; // Import the router

const app = express();
// const cookieParser = cookieParser();
const clientURL = `http://localhost:5173`;
app.use(cors({
  credentials: true,
  origin: clientURL,
}));
const PORT = 3001;

const PgSession = pgSession(session);

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const sessionMiddleware = session({
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: `lax`,
    secure: process.env.NODE_ENV === `production`,
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

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${ PORT }`);
});
