require("dotenv").config();
const axios = require("axios")
const WebSocket = require("ws")

let accessToken = "";
const BUY_PRICE = parseFloat(process.env.BUY_PRICE)
const Profitability = parseFloat(process.env.PROFITABILITY)
let sellPrice = 0;

login();

const ws = new WebSocket("wss://ws.mercadobitcoin.net/ws");

ws.onopen = () => {
    ws.send(JSON.stringify(
        {
            "type": "subscribe",
            "subscription": {
                "name": "ticker",
                "id": process.env.STREAM_ID
            }
        }
    ))
}

ws.onmessage = (evt) => {
    console.clear();
    const obj = JSON.parse(evt.data)
    console.log(obj)
    console.log("SellPrice: " + sellPrice);

    if (obj.type !== "ticker") return;

    if (!sellPrice  && parseFloat(obj.data.sell) <= BUY_PRICE) {
        sellPrice = parseFloat(obj.data.sell) * Profitability;
        console.log("Comprado!")
        newOrder("buy");
        process.exit(0)
    } else if (sellPrice && parseFloat(obj.data.buy) >= sellPrice) {
        newOrder("sell");
    }
}


async function login() {
    const url = "https://api.mercadobitcoin.net/api/v4/authorize"
    const body = {
        login: process.env.API_KEY,
        password: process.env.API_SECRET
    }
    const { data } = await axios.post(url, body)
    console.log("acesso autorizado!")

    setTimeout(login, (data.expiration * 1000) - Date.now());
}

async function newOrder(side) {
    const url = `https://api.mercadobitcoin.net/api/v4/accounts/${process.env.ACCOUNT_ID}/${process.env.SYMBOL}/orders`;
    const body = {
        qty: process.env.BUY_QTY,
        side,
        type: "market",
    }
    const headers = { Authorization: "Bearer " + accessToken };

    try {
        const { data } = await axios.post(url, body, { headers });

        if(side === "sell"){
            sellPrice = 0;
        }
    }
    catch (err) {
        console.error(err.response ? err.response.data : err.message);
        process.exit(0);
    }
}