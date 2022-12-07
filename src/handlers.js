export const selectGames = async (_req, res) => {
    const games = await connection.query("SELECT * FROM games");
    res.status(200).send(games.rows);
};