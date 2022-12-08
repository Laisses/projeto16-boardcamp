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

export const selectCustomers = async (req, res) => {
    const { cpf } = req.query;

    if (cpf) {
        const customers = await connection.query(`
            SELECT * FROM customers WHERE cpf LIKE $1;`, [`${cpf}%`]
        );

        return res.status(200).send(customers.rows);
    }

    const customers = await connection.query("SELECT * FROM customers;");
    return res.status(200).send(customers.rows);
};

export const addCustomer = async (req, res) => {
    const { name, phone, cpf, birthday } = req.body;
    const date = new Date(birthday);

    if (isNaN(date.getTime())) {
        return res.sendStatus(400);
    }

    const cpfExists = await connection.query("SELECT * FROM customers WHERE cpf=$1", [cpf]);

    if (cpfExists.rows.length !== 0) {
        return res.sendStatus(409);
    }

    if (cpf.length !== 11 || isNaN(Number(cpf))) {
        return res.sendStatus(400);

    }

    if (phone.length < 10 || phone.length > 11 || isNaN(Number(phone))) {
        return res.sendStatus(400);
    }

    if (typeof name !== "string" || name === "") {
        return res.sendStatus(400);
    }

    await connection.query("INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4);", [name, phone, cpf, birthday]);

    res.sendStatus(201);
};