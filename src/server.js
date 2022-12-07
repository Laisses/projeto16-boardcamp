import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import { routes } from "./routes.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const main = () => {
    routes(app);

    app.listen(PORT, () => {
        console.log(`server running on port: ${PORT}`);
    });
};

main();
