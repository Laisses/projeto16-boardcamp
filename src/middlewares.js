import { connection } from "./database.js";

export const asyncError = handlerFn => async (req, res, next) => {
    try {
        await handlerFn(req, res, next);
    } catch (err) {
        console.warn(err);
        res.status(500).send({
            message: "Internal Server Error"
        });
    }
};

export const validateNewCustomer = async (req, res, next) => {
    const { name, phone, cpf, birthday } = req.body;
    const date = new Date(birthday);

    if (isNaN(date.getTime())) {
        return res.sendStatus(400);
    }

    const cpfExists = await connection.query("SELECT * FROM customers WHERE cpf=$1;", [cpf]);

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

    next();
};

export const validateUpdatedCustomer = async (req, res, next) => {
    const { name, phone, cpf, birthday } = req.body;
    const { id } = req.params;
    const date = new Date(birthday);

    const customerCpf = await connection.query("SELECT cpf FROM customers WHERE id=$1", [id]);

    if (customerCpf.rows[0].cpf !== cpf) {
        const cpfExists = await connection.query("SELECT * FROM customers WHERE cpf=$1;", [cpf]);

        if (cpfExists.rows.length !== 0) {
            console.log("caí aqui")
            return res.sendStatus(409);
        }
    }

    if (isNaN(date.getTime())) {
        return res.sendStatus(400);
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

    next();
};

export const validateNewRent = async (req, res, next) => {
    const { customerId, gameId, daysRented } = req.body;

    const customerExists = await connection.query(`SELECT * FROM customers WHERE id=$1;`, [customerId]);

    const gameExists = await connection.query(`SELECT * FROM games WHERE id=$1;`, [gameId]);
    const rentals = await connection.query(`SELECT * FROM rentals;`);

       if (!customerExists.rows[0]) {
        return res.sendStatus(400);
    }

    if (!gameExists.rows[0]) {
        return res.sendStatus(400);
    } else {
        const gamesRented = rentals.rows.filter(g => { g.gameId === gameId });
        const stock = gameExists.rows[0].stockTotal;

        if (gamesRented >= stock) {
            return res.sendStatus(400);
        }
    }

    if (daysRented <= 0) {
        console.log("dias menor ou igual a zero");
        return res.sendStatus(400);
    }

    next();
};