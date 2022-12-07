import { connection } from "./database.js";

export const selectCategories = async (_req, res) => {
    const categories = await connection.query("SELECT * FROM categories");
    res.status(200).send(categories.rows);
};

export const selectGames = async (_req, res) => {
    const games = await connection.query("SELECT * FROM games");
    res.status(200).send(games.rows);
};