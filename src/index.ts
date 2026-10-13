import express from "express";
import { useRoutes } from "./routes/user.route.js";
import { globalError, notFoundError } from "./utils/error.js";
import { postRoutes } from "./routes/post.route.js";
import cors from "cors";
import { authRoutes } from "./routes/auth.route.js";
import cookieParser from "cookie-parser";
import { corsOption } from "./config/cors.js";

const PORT = 8000;

const app = express();

app.use(cors(corsOption));
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json());
app.use(cookieParser());

app.get("/api", (req, res) => res.status(200).send("welcome to my API"));
app.use("/users", useRoutes);
app.use("/posts", postRoutes);
app.use("/auth", authRoutes);

app.use(globalError);
app.use(notFoundError);
app.listen(PORT, () => console.log(`Server running on port : ${PORT}`));
