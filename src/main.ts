import express from "express";
import cors from "cors";
import helmet from "helmet";

import { PORT } from "./config/env.config";
import errorMiddleware from "./middlewares/error.middleware";
import router from "./routers";
import profileRouter from "./routers";
import dashboardRoutes from "./routers/dashboard.route";
import adminRoutes from "./routers/admin.route";
import transactionRoutes from './routers/transaction.route';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api", router);
app.use("/api/profile", profileRouter);
app.use("/api/dashboard", dashboardRoutes);
app.use(
  "/api/admin",
  (req, res, next) => {
    console.log("🔵 /api/admin/* request:", req.method, req.url);
    next();
  },
  adminRoutes
);
app.use('/api/transactions', transactionRoutes);

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
