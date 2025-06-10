"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionMiddleware = void 0;
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const express_session_1 = tslib_1.__importDefault(require("express-session"));
const connect_pg_simple_1 = tslib_1.__importDefault(require("connect-pg-simple"));
const pg_1 = require("pg");
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
dotenv_1.default.config();
// import cookieParser from 'cookieParser';
const cors_1 = tslib_1.__importDefault(require("cors"));
const auth_1 = tslib_1.__importDefault(require("./routes/auth")); // Import the router
const app = (0, express_1.default)();
const clientURLs = [
    `http://localhost:5173`,
    // REMOVE THIS ONE after testing
    `https://*.ngrok-free.app`,
];
app.use((0, cors_1.default)({
    credentials: true,
    origin: clientURLs,
}));
const PORT = 3001;
const PgSession = (0, connect_pg_simple_1.default)(express_session_1.default);
const pgPool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
exports.sessionMiddleware = (0, express_session_1.default)({
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
app.use(express_1.default.json()); // Use JSON middleware you slugs
app.use(exports.sessionMiddleware); // Session storage
app.use(auth_1.default);
app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost${PORT}`);
});
//# sourceMappingURL=index.js.map