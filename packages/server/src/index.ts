import express from 'express';

const app = express();
const PORT = 3001;

app.get(`/`, (_req, res) => {
  res.send(`Hello from TypeScript backend!`);
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${ PORT }`);
});
