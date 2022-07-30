// version2
const http = require('http');
const app = require('./api/v2/app2');

const port = process.env.PORT || 9000

const server = http.createServer(app);

server.listen(port, ()=>{
    console.log(`Listen on port ${port}`)
})