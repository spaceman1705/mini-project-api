"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const env_config_1 = require("./config/env.config");
const error_middleware_1 = __importDefault(require("./middlewares/error.middleware"));
const routers_1 = __importDefault(require("./routers"));
const routers_2 = __importDefault(require("./routers"));
const dashboard_route_1 = __importDefault(require("./routers/dashboard.route"));
const admin_route_1 = __importDefault(require("./routers/admin.route"));
const transaction_route_1 = __importDefault(require("./routers/transaction.route"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api", routers_1.default);
app.use("/api/profile", routers_2.default);
app.use("/api/dashboard", dashboard_route_1.default);
app.use("/api/admin", (req, res, next) => {
    console.log("🔵 /api/admin/* request:", req.method, req.url);
    next();
}, admin_route_1.default);
app.use('/api/transactions', transaction_route_1.default);
app.use(error_middleware_1.default);
app.listen(env_config_1.PORT, () => {
    console.log(`Server is running on port ${env_config_1.PORT}`);
});
