import * as handlers from "./handlers.js";
import * as middlewares from "./middlewares.js";

export const routes = (app) => {

    app.get("/categories", middlewares.asyncError(handlers.selectCategories));
    app.post("/categories", middlewares.asyncError(handlers.addCategory));

    app.get("/games", middlewares.asyncError(handlers.selectGames));
};