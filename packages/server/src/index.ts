import express from 'express';

const app = express();
const PORT = 3001;

app.get(`/`, (_req, res) => {
  res.send(`Welcome from TypeScript backend!`);
});
app.use(express.json()); // Use JSON middleware you slugs

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${ PORT }`);
});
