import express from 'express';
// import cookieParser from 'cookieParser';
import cors from 'cors';
import authRouter from './routes/auth'; // Import the router

const app = express();
// const cookieParser = cookieParser();
const clientURL = `http://localhost:5173`;
app.use(cors({
  origin: clientURL,
}));
const PORT = 3001;

app.get(`/`, (_req, res) => {
  res.send(`Welcome from TypeScript backend!`);
});
app.use(express.json()); // Use JSON middleware you slugs
app.use(authRouter);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${ PORT }`);
});
