"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
// import cookieParser from 'cookieParser';
const cors_1 = tslib_1.__importDefault(require("cors"));
const auth_1 = tslib_1.__importDefault(require("./routes/auth")); // Import the router
const app = (0, express_1.default)();
// const cookieParser = cookieParser();
const clientURL = `http://localhost:5173`;
app.use((0, cors_1.default)({
    origin: clientURL,
}));
const PORT = 3001;
app.get(`/`, (_req, res) => {
    res.send(`Welcome from TypeScript backend!`);
});
app.use(express_1.default.json()); // Use JSON middleware you slugs
app.use(auth_1.default);
app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map