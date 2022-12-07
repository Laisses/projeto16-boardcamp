import * as handlers from "./handlers.js";
import * as middlewares from "./middlewares.js";

export const routes = (app) => {
    app.get("/games", middlewares.asyncError(handlers.selectGames));
};