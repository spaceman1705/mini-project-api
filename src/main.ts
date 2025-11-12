import express from "express";
import cors from "cors";
import helmet from "helmet";

import { PORT } from "./config/env.config";
import errorMiddleware from "./middlewares/error.middleware";
import router from "./routers";
import profileRouter from "./routers"

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api", router);
app.use("/api/profile", profileRouter)

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



