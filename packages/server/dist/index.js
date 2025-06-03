"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const app = (0, express_1.default)();
const PORT = 3001;
app.get(`/`, (_req, res) => {
    res.send(`Hello from TypeScript backend!`);
});
app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map