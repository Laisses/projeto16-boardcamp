import { connection } from "./database.js";

export const selectCategories = async (_req, res) => {
    const categories = await connection.query("SELECT * FROM categories;");
    res.status(200).send(categories.rows);
};

export const addCategory = async (req, res) => {
    const { name } = req.body;
    const nameExists = await connection.query(
        "SELECT name FROM categories WHERE name = $1;",
        [name]
    );

    if (!name) {
        return res.sendStatus(400);
    }

    if (nameExists.rows.length !== 0) {
        return res.sendStatus(409);
    }

    await connection.query(
        "INSERT INTO categories (name) VALUES ($1);",
        [name]
    );

    res.sendStatus(201);
};

export const selectGames = async (req, res) => {
    const { name } = req.query;

    const games = await connection.query(`
        SELECT games.id, games.name, image, "stockTotal", "categoryId", "pricePerDay", categories.name as "categoryName"
        FROM games
        JOIN categories ON games."categoryId" = categories.id;
    `);

    if (name) {
        const games = await connection.query(`
            SELECT games.id, games.name, image, "stockTotal", "categoryId", "pricePerDay", categories.name as "categoryName"
            FROM games
            JOIN categories ON games."categoryId" = categories.id
            WHERE games.name ILIKE $1;
        `, [`${name}%`]);

        return res.status(200).send(games.rows);
    }

    res.status(200).send(games.rows);
};

export const addGame = async (req, res) => {
    const { name, image, stockTotal, categoryId, pricePerDay } = req.body;

    const categoryExists = await connection.query(
        "SELECT id FROM categories WHERE id = $1;",
        [categoryId]
    );

    const gameExists = await connection.query(
        "SELECT name FROM games WHERE name = $1;",
        [name]
    );

    if (gameExists.rows.length !== 0) {
        return res.sendStatus(409);
    }

    if (categoryExists.rows.length === 0) {
        return res.sendStatus(400);
    }

    if (name === "" || stockTotal <= 0 || pricePerDay <= 0) {
        return res.sendStatus(400);
    }

    await connection.query(
        `INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5);`,
        [name, image, stockTotal, categoryId, pricePerDay]
    );

    res.sendStatus(201);
};