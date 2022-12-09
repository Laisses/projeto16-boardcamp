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

export const selectCustomers = async (req, res) => {
    const { cpf } = req.query;

    if (cpf) {
        const customers = await connection.query(`
            SELECT * FROM customers WHERE cpf LIKE $1;`, [`${cpf}%`]
        );

        return res.status(200).send(customers.rows);
    }

    const customers = await connection.query("SELECT * FROM customers;");

    const editCustomers = customers.rows.map(c => {
        const [birthdayString] = c.birthday.toISOString().split("T");
        return { ...c, birthday: birthdayString };
    })

    return res.status(200).send(editCustomers);
};

export const selectCustomer = async (req, res) => {
    const { id } = req.params;

    const customer = await connection.query("SELECT * FROM customers WHERE id=$1", [id]);

    if (customer.rows.length === 0) {
        return res.sendStatus(404);
    }

    const [birthdayString] = customer.rows[0].birthday.toISOString().split("T");

    res.status(200).send({ ...customer.rows[0], birthday: birthdayString });

};

export const addCustomer = async (req, res) => {
    const { name, phone, cpf, birthday } = req.body;

    await connection.query("INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4);", [name, phone, cpf, birthday]);

    res.sendStatus(201);
};

export const updateCustomer = async (req, res) => {
    const { name, phone, cpf, birthday } = req.body;
    const { id } = req.params;

    const customer = await connection.query("SELECT * FROM customers WHERE id=$1", [id]);

    if (customer.rows.length === 0) {
        return res.sendStatus(404);
    }

    await connection.query(`UPDATE customers
        SET name=$1, phone=$2, cpf=$3, birthday=$4
        WHERE id=$5
    ;`, [name, phone, cpf, birthday, id]);

    res.sendStatus(200);
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

export const selectRentals = async (req, res) => {
    const {customerId, gameId} = req.query;

    const rentalInfo = await connection.query(`
    SELECT
        rent.id, rent."customerId", rent."gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee", c.id AS "customerId", c.name AS "customerName", g.id AS "gameId", g.name AS "gameName", cat.id AS "categoryId", cat.name AS "categoryName"
    FROM
        rentals AS "rent"
    JOIN
        customers AS "c"
    ON
        rent."customerId" = c.id
    JOIN
        games AS "g"
    ON
        rent."gameId" = g.id
    JOIN
        categories AS "cat"
    ON
        g."categoryId" = cat.id
    ;`);

    const rentals = rentalInfo.rows.map(r => {
        return {
            ...r,
            customer: {
                id: r.customerId,
                name: r.customerName
            },
            game: {
                id: r.gameId,
                name: r.gameName,
                categoryId: r.categoryId,
                categoryName: r.categoryName
            }
        };
    });

    if (customerId) {
        const rentalsByCustomer = rentals.filter(r => r.customer.id = customerId);
        return res.status(200).send(rentalsByCustomer);
    }

    if (gameId) {
        const rentalsByGame = rentals.filter(r => r.game.id = gameId);
        return res.status(200).send(rentalsByGame);
    }

    res.status(200).send(rentals);
};