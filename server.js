const express = require('express');
const bodyParser = require('body-parser');
const payments = require("./payments").payment;
const settings = require('./settings.js');

const host = settings.host;
const port = settings.port;

const app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));

const payment = new payments('b005598f0d8dad0979fc12b9db8bd7c2',
    'pk_5d2fc8839c90a7eabecc818c44daa',
    '03800b2d939a075b48ef0d9665efade4',
    'pk_eac43a5380e774fa09282743b4fab');

class Endpoint {

    static index(request, response) {
        response.sendFile(__dirname + "/index.html")
    }

    static secureIndex(request, response) {
        payment.linkCardThreeDS(request.body["PaRes"], request.body["MD"]).then((data) => {
            response.json(data["Token"]);
        });
    }

    static linkCard(request, response) {
        let ip = request.socket.remoteAddress;
        payment.linkCardPayment(request.body["cryptogram"], ip, request.body["userId"]).then((data) => {
            response.json(data);
        }).catch(() => {
            response.statusCode = 400;
            response.end();
        });
    }

    static pay(request, response) {
        let data = request.body;
        payment.payment(data["token"], data["amount"], data["userId"], data["accumulationId"]).then((data) => {
            response.json(data);
        }).catch(() => {
            response.statusCode = 400;
            response.end();
        })
    }

    static payout(request, response) {
        let data = request.body;
        payment.payout(data["token"], data["userId"], data["accumulationId"], data["amount"], data["transactions"])
            .then((data) => {
                response.json(data);
            }).catch(() => {
            response.statusCode = 400;
            response.end();
        })
    }
}

app.use(express.static("static"));
app.get("/", Endpoint.index);
app.post("/", Endpoint.secureIndex);
app.post("/linkCard", Endpoint.linkCard);
app.post("/pay", Endpoint.pay);
app.post("/payout", Endpoint.payout)

const server = settings.createServer(app);
server.listen(port, host, () => {
    console.log(`Server is running on https://${host}:${port}`);
});
