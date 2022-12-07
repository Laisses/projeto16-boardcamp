export const routes = (app, connection) => {

    app.get("/games", async (req, res) => {

        try {
            const games = await connection.query("SELECT * FROM games");
            res.send(games.rows);
        } catch(err) {
            console.log(err);
        }

    });

};