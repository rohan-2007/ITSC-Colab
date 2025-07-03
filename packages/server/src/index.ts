import express from 'express';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import type { RequestHandler } from 'express';
import authRouter from './routes/auth';
import evalRouter from './routes/eval';
import supervisorRouter from './routes/supervisor';
import gitreportsRouter from './routes/gitreports';
import rubricRouter from './routes/rubric';
import { seedRubricData } from './seed';
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
      maxAge: 1000 * 60 * 60 * 24 * 7,
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
  app.use(express.json());
  app.use(sessionMiddleware);
  app.use(authRouter);
  app.use(evalRouter);
  app.use(rubricRouter);
  app.use(supervisorRouter);
  app.use(gitreportsRouter);

  app.use((req, res) => {
    res.status(404).json({ error: `Route not found`, path: req.path });
  });

  app.listen(PORT, () => {
    console.log(`server running on PORT 3001`);
  });
};

main().catch(() => {
  process.exit(1);
});
