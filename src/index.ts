import express from "express";
import { useRoutes } from "./routes/user.route.js";
import { globalError, notFoundError } from "./utils/error.js";

const PORT = 8000;

const app = express();

app.use(express.json());

app.get("/api", (req, res) => {
  res.status(200).send("welcome to my API");
});
app.use("/users", useRoutes);

app.use(globalError);
app.use(notFoundError);
app.listen(PORT, () => {
  console.log(`Server running on port : ${PORT}`);
});
