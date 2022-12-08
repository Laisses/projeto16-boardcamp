import * as handlers from "./handlers.js";
import * as middlewares from "./middlewares.js";

export const routes = (app) => {

    app.get("/categories", middlewares.asyncError(handlers.selectCategories));
    app.post("/categories", middlewares.asyncError(handlers.addCategory));

    app.get("/customers", middlewares.asyncError(handlers.selectCustomers));
    app.get("/customers/:id", middlewares.asyncError(handlers.selectCustomer));
    app.post("/customers", middlewares.asyncError(handlers.addCustomer));
    app.put("/customers/:id", middlewares.asyncError(handlers.updateCustomer));

    app.get("/games", middlewares.asyncError(handlers.selectGames));
    app.post("/games", middlewares.asyncError(handlers.addGame));
};