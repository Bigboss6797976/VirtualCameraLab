import express from "express";
import path from "path";
const app = express();
app.use(express.static(path.join(process.cwd(), "dist")));
app.listen(process.env.PORT || 3000, () => {
  console.log("Server running on port " + (process.env.PORT || 3000));
});
