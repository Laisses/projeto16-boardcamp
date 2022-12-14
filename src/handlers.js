import { connection } from "./database.js";

export const selectCategories = async (req, res) => {
    const { limit, offset, order, desc } = req.query;

    const allowedColumns = ["id", "name"];
    const orderName = allowedColumns.includes(order) ? order : "id";
    const direction = desc === "true" ? "DESC" : "ASC";

    const categories = await connection.query(`SELECT * FROM categories
    ORDER BY ${orderName} ${direction}
    LIMIT $1
    OFFSET $2
    ;`, [limit || null, offset || null]);

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
    const { cpf, offset, limit, order, desc } = req.query;

    const allowedColumns = ["id", "name", "phone", "cpf", "birthday"];
    const orderName = allowedColumns.includes(order) ? order : "id";
    const direction = desc === "true" ? "DESC" : "ASC";

    if (cpf) {
        const customers = await connection.query(`
            SELECT * FROM customers WHERE cpf LIKE $1
            LIMIT $2
            OFFSET $3;
        `, [`${cpf}%`, limit || null, offset || null]
        );

        return res.status(200).send(customers.rows);
    }

    const customers = await connection.query(`SELECT * FROM customers
    ORDER BY ${orderName} ${direction}
    LIMIT $1
    OFFSET $2
    ;`, [limit || null, offset || null]);

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
    const { name, offset, limit, order, desc } = req.query;

    const allowedColumns = ["id", "name", "image", "stockTotal", "categoryId", "pricePerDay", "categoryName"];
    const orderName = allowedColumns.includes(order) ? order : "id";
    const direction = desc === "true" ? "DESC" : "ASC";

    const games = await connection.query(`
        SELECT games.id, games.name, image, "stockTotal", "categoryId", "pricePerDay", categories.name as "categoryName"
        FROM games
        JOIN categories ON games."categoryId" = categories.id
        ORDER BY "${orderName}" ${direction}
        LIMIT $1
        OFFSET $2;
    `, [limit || null, offset || null]);

    if (name) {
        const games = await connection.query(`
            SELECT games.id, games.name, image, "stockTotal", "categoryId", "pricePerDay", categories.name as "categoryName"
            FROM games
            JOIN categories ON games."categoryId" = categories.id
            WHERE games.name ILIKE $1
            ORDER BY "${orderName}" ${direction}
            LIMIT $2
            OFFSET $3;
        `, [`${name}%`, limit || null, offset || null]);

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
    const { customerId, gameId, offset, limit, order, desc, status, startDate } = req.query;

    const allowedColumns = ["id", "customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee"];
    const orderName = allowedColumns.includes(order) ? order : "id";
    const direction = desc === "true" ? "DESC" : "ASC";

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
    ORDER BY "${orderName}" ${direction}
    LIMIT $1
    OFFSET $2
    ;`, [limit || null, offset || null]);

    const rentals = rentalInfo.rows.map(r => {

        if (!r.returnDate) {
            const [date] = r.rentDate.toISOString().split("T");

            return {
                id: r.id,
                customerId: r.customerId,
                gameId: r.gameId,
                rentDate: date,
                daysRented: r.daysRented,
                returnDate: r.returnDate,
                originalPrice: r.originalPrice,
                delayFee: r.delayFee,
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
        } else {
            const [rentedDate] = r.rentDate.toISOString().split("T");
            const [returnedDate] = r.returnDate.toISOString().split("T");

            return {
                id: r.id,
                customerId: r.customerId,
                gameId: r.gameId,
                rentDate: rentedDate,
                daysRented: r.daysRented,
                returnDate: returnedDate,
                originalPrice: r.originalPrice,
                delayFee: r.delayFee,
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
        }

    });

    if (customerId) {
        const rentalsByCustomer = rentals.filter(r => r.customer.id === customerId);
        return res.status(200).send(rentalsByCustomer);
    }

    if (gameId) {
        const rentalsByGame = rentals.filter(r => r.game.id === gameId);
        return res.status(200).send(rentalsByGame);
    }

    if (status === "open") {
        const openRentals = rentals.filter(r => !r.returnDate);
        return res.status(200).send(openRentals);
    }

    if (status === "closed") {
        const closedRentals = rentals.filter(r => r.returnDate);
        return res.status(200).send(closedRentals);
    }

    if (startDate) {
        const filteredRentals = rentals.filter(r => r.rentDate >= startDate);
        return res.status(200).send(filteredRentals);
    }

    res.status(200).send(rentals);
};

export const addRental = async (req, res) => {
    const { customerId, gameId, daysRented } = req.body;
    const date = new Date();

    const price = await connection.query(`SELECT "pricePerDay" FROM games WHERE id=$1;`, [gameId]);

    const originalPrice = price.rows[0].pricePerDay * daysRented;

    await connection.query(`
        INSERT INTO
            rentals ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee")
        VALUES
            ($1, $2, $3, $4, $5, $6, $7)
    ;`, [customerId, gameId, date, daysRented, null, originalPrice, null]);

    res.sendStatus(201);
};

export const finalizeRental = async (req, res) => {
    const { id } = req.params;
    const currentDate = new Date();

    const rental = await connection.query(`SELECT * FROM rentals WHERE id=$1;`, [id]);

    const rentDate = rental.rows[0].rentDate;
    const day = 1000 * 60 * 60 * 24;

    const daysRented = Math.floor((currentDate.getTime() - rentDate.getTime()) / day);
    const daysDelayed = daysRented - Number(rental.rows[0].daysRented);

    if (daysDelayed <= 0) {
        await connection.query(`UPDATE rentals SET "returnDate"=$1 WHERE id=$2;`, [currentDate, id]);
        return res.sendStatus(200);
    }

    const price = Number(rental.rows[0].originalPrice);
    const delayFee = daysDelayed * price;

    await connection.query(`UPDATE rentals SET "returnDate"=$1, "delayFee"=$2 WHERE id=$3;`, [currentDate, delayFee, id]);

    res.sendStatus(200);
};

export const deleteRent = async (req, res) => {
    const { id } = req.params;

    await connection.query(`DELETE FROM rentals WHERE id=$1;`, [id]);

    res.sendStatus(200);
};
