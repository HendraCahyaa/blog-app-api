import express from "express";
import { useRoutes } from "./routes/user.route.js";
import { globalError, notFoundError } from "./utils/error.js";
import { postRoutes } from "./routes/post.route.js";
import cors from "cors";

const PORT = 8000;

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
  res.status(200).send("welcome to my API");
});
app.use("/users", useRoutes);
app.use("/posts", postRoutes);

app.use(globalError);
app.use(notFoundError);
app.listen(PORT, () => {
  console.log(`Server running on port : ${PORT}`);
});
