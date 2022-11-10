const http = require('http');
const https = require('https');
const fs = require('fs');

const options = {
    key: fs.readFileSync('ssl/key.pem'),
    cert: fs.readFileSync('ssl/cert.pem')
};

const host = '195.43.142.88';
const port = 443;


const requestListener = function (req, res) {
    res.writeHead(200);
    res.end("My first server!");
};

const server = https.createServer(options, requestListener);
server.listen(port, host, () => {
    console.log(`Server is running on https://${host}:${port}`);
});
