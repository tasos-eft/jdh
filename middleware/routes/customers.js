/*jshint esversion: 6 */

// customers API ROUTES
const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const WPAPI = require('wpapi');
/* mongoDB database */
const db = require('../utilities/mongodb-utility');
/* custom helpers */
const helper = require('../utilities/helper');

/* WP-API connect to the api */
const CMS = new WPAPI({
    endpoint: helper.constants.endpoint,
    username: helper.constants.username,
    password: helper.constants.password
});

/* 
 * Customer's mobile phone becomes main identification tool
 * WP must not contain the actual phone-number since sensitive information should be hosted only on Brown-Forman servers. 
 * Thus the sting is encrypted and saved as a custom field.  
 * All Queries are done to WP CMS via this encrypted string and the actual data is mirrored on MongoDB and Heroku. 
 */

CMS.customers = CMS.registerRoute('wp/v2', '/customers/(?P<id>\\d+)/?(?P<field>[\\w\\-\\_]+)?');

router.post('/wp-api-customers/', (req, res) => {
    /* 
     * Find customer by phone, or create new
     * Search for a customer via their encrypted phone number on the CMS
     * If customer doesn't exist, create a new one 
     * Save changes on Mlab (mongoDB)     
     */
    const phone = req.body.phone;
    /* encrypted customer's phone number */
    let encryptedPhone = '';
    let title = '';
    if (phone) {
        encryptedPhone = helper.encrypt(phone);
        /* generate new customer's title, last 8 digits of encrypted string & last 4 digits of their phone */
        title = encryptedPhone.substr(encryptedPhone.length - 8) + '-' + phone.substr(phone.length - 4);
    }
    /* Search for customer via the encrypted phone number (which is also stored as customer's slug) */
    let searchTarget = {};

    CMS.customers().slug(encryptedPhone)
        .then(customer => {
            searchTarget = customer[0];
            /* customer isn't found */
            if (customer.length === 0) {
                searchTarget = CMS.customers().create({
                    title: title,
                    slug: encryptedPhone,
                    status: 'publish',
                    fields: {
                        encrypted_identification: encryptedPhone
                    }
                });
            }
            return searchTarget;
        })
        .then(searchResult => {
            /*  attach phone & pin to customer document */
            searchTarget.phone = phone;
            searchTarget.pin = null;
            let updateMLab;
            try {
                updateMLab = db.get().collection('customers').update({ 'id': searchResult.id }, searchResult, { 'upsert': true });
            } catch (error) {
                updateMLab = error;
                console.log('customer controller error, customer update query with phone ' + phone + ' returned ', error);
            }
            return updateMLab;
        })
        .then(data => res.json(data))
        .catch(error => res.json(error));
});


router.post('/twilio/', (req, res) => {
    /*  get wp customer id from request */
    const phone = req.body.phone;

    /* encrypted customer's phone number */
    let encryptedPhone = '';
    if (phone) {
        encryptedPhone = helper.encrypt(phone);
    }

    /* generate pin */
    let pin = helper.pinGenerator();

    /* tweak for UK test */
    if (phone === '0870000000' || phone === '0871234567') {
        pin = '0000';
    }

    let searchTarget = {};

    /* find customer by their phone number */
    CMS.customers().slug(encryptedPhone)
        .then(customer => {
            searchTarget = customer[0];
            /*  attach phone & pin to customer document */
            searchTarget.phone = phone;
            searchTarget.pin = pin;
            /*  update document on the database */
            let updateMLab;
            try {
                updateMLab = db.get().collection('customers').update({ 'id': searchTarget.id }, searchTarget);
            } catch (error) {
                updateMLab = error;
                console.log('customer controller error, customer update query with id ' + searchTarget.id + ' returned ', error);
            }
            return updateMLab;
        })
        .then(data => {
            let twilioPhone = '+353' + phone.substring(1);
            let twilioResponse = null;
            /*              
             * cheat for QA              
             */
            if (twilioPhone === '+353871234567' || twilioPhone === '+353870000000') {
                twilioResponse = { status: 'QA cheat mode' };
            }
            /*              
             * twilio message
             */
            else {
                /* SMS message */
                const message = 'Your pin is ' + pin + '. Welcome to the Jack Daniel’s Honey family.\nwww.drinkaware.ie';
                /*  twilio client */
                const sms = new twilio(helper.constants.sid, helper.constants.token);
                /*  send pin to customer's phone number via Twilio */
                twilioResponse = sms.api.messages
                    .create({
                        body: message,
                        to: twilioPhone,
                        from: helper.constants.number
                    });
            }
            return twilioResponse;
        })
        .then(response => res.json(response.status))
        .catch(error => res.json(error));
});

module.exports = router;