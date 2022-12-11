import { connection } from "./database.js";
import {validator} from "./schemas.js";

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

export const validate = schema => (req, res, next) => {
    const payload = req.body;
    const { error } = validator(schema, payload);

    if (error) {
        const errors = error.details.map((detail) => detail.message);
        return res.status(422).send({
            message: "Unprocessable Entity",
            errors,
        });
    }

    next();
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
        return res.sendStatus(400);
    }

    next();
};

export const validateReturn = async (req, res, next) => {
    const { id } = req.params;

    const rental = await connection.query(`SELECT * FROM rentals WHERE id=$1;`, [id]);

    if (!rental.rows[0]) {
        return res.sendStatus(404);
    }

    if (rental.rows[0].retrunDate) {
        return res.sendStatus(400);
    }

    next();
};

export const validateDeletion = async (req, res, next) => {
    const { id } = req.params;

    const rental = await connection.query(`SELECT * FROM rentals WHERE id=$1;`, [id]);

    if (rental.rows.length === 0) {
        return res.sendStatus(404);
    }

    const returnDate = rental.rows[0].returnDate;

    if (!returnDate) {
        return res.sendStatus(400);
    }

    next();
};

const isIntegerString = s => {
    if (s === undefined) {
        return true;
    }

    if (typeof s !== "string") {
        return false;
    }

    if (s.length === 0) {
        return true;
    }

    const n = Number(s);
    if (isNaN(n) || n < 0 || n !== Math.floor(n)) {
        return false;
    }

    return true;
};

const isQueryString = s => {
    if (s === undefined) {
        return true;
    }

    if (s.length === 0) {
        return true;
    }

    if (typeof s === "string" && isNaN(s)) {
        return true;
    }

    return false;
};

const isQueryDate = d => {
    if (d === undefined) {
        return true;
    }

    if (d.length !== 10) {
        return false;
    }

    if (!(new Date(d).toString() === "Invalid Date")) {
        return true;
    }

    return false;
};

export const validateQueryParams = async (req, res, next) => {
    const { offset, limit, order, status, startDate } = req.query;

    if (!isIntegerString(limit) || !isIntegerString(offset)) {
        return res.sendStatus(400);
    }

    if (!isQueryString(order) || !isQueryString(startDate) || !isQueryString(status)) {
        return res.sendStatus(400);
    }

    if (!isQueryDate(startDate)) {
        return res.sendStatus(400);
    }

    next();
};