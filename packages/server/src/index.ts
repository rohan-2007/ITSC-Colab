import express from 'express';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
// import cookieParser from 'cookieParser';
import cors from 'cors';
import type { RequestHandler } from 'express';
import authRouter from './routes/auth'; // Import the router
import evalRouter from './routes/eval'; // Import the evaluation router
import supervisorRouter from './routes/supervisor';
import rubricRouter from './routes/rubric';
import { seedRubricData } from './seed'; // Adjust the path as needed
export let sessionMiddleware: RequestHandler;

const main = async () => {
  await seedRubricData();

  const app = express();
  const clientURLs = [
    `http://localhost:5173`,
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

  sessionMiddleware = session({
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
  app.use(evalRouter);
  app.use(rubricRouter);
  app.use(supervisorRouter);
  app.use((req, res) => {
    res.status(404).json({ error: `Route not found`, path: req.path });
  });

  app.listen(PORT, () => {
  // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${ PORT }`);
  });
};

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
});
