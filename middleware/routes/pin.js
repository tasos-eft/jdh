/*jshint esversion: 6 */

// Users API ROUTES
const express = require('express');
const router = express.Router();
const ObjectID = require('mongodb').ObjectID;
/* mongoDB database */
const db = require('../utilities/mongodb-utility');
/* custom helpers */
const helper = require('../utilities/helper');

router.post('/pin/', (req, res) => {
    /* compare pin from client, with saved pin on mongoDB */
    let customerPhone = null;
    let givenPin = null;
    /* customer's phone */
    customerPhone = req.body.phone;
    /* given pin */
    givenPin = req.body.pin;
    /* customer data saved on mongoDB */
    db.get()
        .collection('customers')
        .find({ 'phone': customerPhone }).toArray(function(error, results) {
            if (error) {
                res.status(500).json({ 'error': error });
            };
            if (results.length > 0) {
                /* results come back */
                let valid = false;
                let customer = new Object();
                customer = results[0];
                /* check if object has property */
                if (customer.hasOwnProperty('pin') && givenPin === customer.pin) {
                    valid = true;
                }
                res.json({ valid: valid });
            } else {
                console.log('pin controller error, customer query with phone ' + customerPhone + ' returned empty array ', results);
                res.json({ valid: false });
            }
        });
});

module.exports = router;