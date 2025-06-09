const useLocal = false;

const PORT = 3001;
const appId = `b047-129-137-96-4`;
let exportUrl = `https://${appId}.ngrok-free.app`;

if (useLocal) {
  exportUrl = `http://localhost:${PORT}`;
} else {
  exportUrl = `https://${appId}.ngrok-free.app`;
}
export default exportUrl;
