import express from "express";
import cors from "cors";
import helmet from "helmet";

import { PORT } from "./config/env.config";
import errorMiddleware from "./middlewares/error.middleware";
import router from "./routers";
import profileRouter from "./routers/profile.route";
import dashboardRoutes from "./routers/dashboard.route";
import adminRoutes from "./routers/admin.route";
import transactionRoutes from './routers/transaction.route';

const app = express();

app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://mini-project-web-fawn.vercel.app',
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Tambahkan root route untuk testing
app.get("/", (req, res) => {
  res.json({ message: "API is running", status: "ok" });
});

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

// Untuk development/local
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT || 3000, () => {
    console.log(`Server running on port ${PORT || 3000}`);
  });
}

// Export untuk Vercel
export default app;