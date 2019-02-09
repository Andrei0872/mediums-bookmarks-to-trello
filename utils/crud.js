const fetch = require('node-fetch')

const getTrelloInfo = (() => {
    const URL = process.env.urlTrello;
    const headers = {
        cookie: process.env.cookieTrello
    }

    return async () => {
        const { lists } = await (await fetch(URL, { headers, method: "GET" })).json()

        return lists;
    };
})();

getTrelloInfo.idBoard = process.env.idBoard;

const addList = (() => {
    const URL = process.env.urlTrelloLists;
    const headers = {
        cookie: process.env.cookieTrello,
        'Content-Type': 'application/json'
    };
    const body = {
        closed: false,
        idBoard: process.env.idBoard,
        name: "",
        pos: 5308415,
        token: process.env.tokenTrello
    };

    return async (listName, board = null) => {
        body['name'] = listName;
        board !== null && (body['idBoard'] = board);

        const { id, name, idBoard } = await (await fetch(URL, {
            headers,
            method: "POST",
            body: JSON.stringify(body)
        })).json(); 

        return { id, name, idBoard };
    };
})();

const generateLists = (() => {
    return async (infoArr, idBoard) => {
        return await Promise.all(
            infoArr.map(async ({ name }) => addList(name, idBoard))
        );
    };
})();


module.exports = {
    getTrelloInfo,
    addList,
    generateLists,
}