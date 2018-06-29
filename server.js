/*jshint esversion: 6 */
const newrelic = require('newrelic');

const compression = require('compression');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const app = express();
const socketIO = require('socket.io');
// socket IO Utility
const ws = require('./middleware/utilities/socket-io');
// MongoDB Utility
const db = require('./middleware/utilities/mongodb-utility');
// API routes
const customers = require('./middleware/routes/customers');
const pin = require('./middleware/routes/pin');
const drinks = require('./middleware/routes/drinks');
const pubs = require('./middleware/routes/pubs');
const redemption = require('./middleware/routes/redemption');
/* custom helpers */
const helper = require('./middleware/utilities/helper');

// Parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Create link to Angular build directory, dist output folder
const distDir = __dirname + '/dist/';
const distIndex = __dirname + '/dist/index.html';

// Gzip
app.use(compression());
// static content
app.use(express.static(distDir));

// API EndPoints
app.use('/identify-customers', customers);
app.use('/verify-pin', pin);
app.use('/available-drinks', drinks);
app.use('/available-pubs', pubs);
app.use('/redemption', redemption);

// Send all other requests to the Angular app
app.get('*', (req, res) => {
    res.sendFile(distIndex);
});

//Set Port
const port = process.env.PORT || 8080;
app.set('port', port);

// Connect to the database before starting the application server.
const dbUri = helper.constants.dbUri;

db.connect(dbUri, connectionError => {
    if (connectionError) {
        console.log('unable to connect to database .', connectionError);
        process.exit(1);
    } else {
        console.log('database connection ready');
        const server = http.createServer(app);
        server.listen(port);
        // add error handler
        server.on('error', error => {
            console.log('ERROR', error);
        });
        // start listening on port
        server.on('listening', () => {
            console.log(`app is running on http://localhost:${port}/ `);
        });
        // socket
        const io = socketIO(server);
        // socket.io events
        ws.socketEvents(io);
    }
});
