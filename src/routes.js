import * as handlers from "./handlers.js";
import * as m from "./middlewares.js";

export const routes = (app) => {

    app.get("/categories", m.asyncError(handlers.selectCategories));
    app.post("/categories", m.asyncError(handlers.addCategory));

    app.get("/customers", m.asyncError(handlers.selectCustomers));
    app.get("/customers/:id", m.asyncError(handlers.selectCustomer));
    app.post("/customers", m.validateNewCustomer, m.asyncError(handlers.addCustomer));
    app.put("/customers/:id", m.validateUpdatedCustomer, m.asyncError(handlers.updateCustomer));

    app.get("/games", m.asyncError(handlers.selectGames));
    app.post("/games", m.asyncError(handlers.addGame));

    app.get("/rentals", m.asyncError(handlers.selectRentals));
    app.post("/rentals", m.validateNewRent, m.asyncError(handlers.addRental));
    app.post("/rentals/:id/return", m.validateReturn, m.asyncError(handlers.finalizeRental));
    app.delete("/rentals/:id", m.validateDeletion, m.asyncError(handlers.deleteRent));
};