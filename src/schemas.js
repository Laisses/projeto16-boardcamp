import Joi from "joi";

export const validator = (schema, payload) =>
    schema.validate(payload, { abortEarly: false });

export const user = Joi.object({
    name: Joi.string().min(2).required(),
    phone: Joi.string().min(11).max(11).required(),
    cpf: Joi.string().min(11).max(11).required(),
    birthday: Joi.string().min(10).max(10).required(),
});

export const category = Joi.object({
    name: Joi.string().required()
});

export const game = Joi.object({
    name: Joi.string().required(),
    image: Joi.string(),
    stockTotal: Joi.number().integer().min(1).required(),
    categoryId: Joi.number().integer().required(),
    pricePerDay: Joi.number().integer().required()
});