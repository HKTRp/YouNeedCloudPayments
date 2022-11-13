const http = require('http');

const host = 'localhost';
const port = 8080;

const createServer = function (app) {
    return http.createServer(app);
}

exports.host = host;
exports.port = port;
exports.createServer = createServer;