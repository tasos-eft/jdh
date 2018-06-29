/*jshint esversion: 6 */

// Users API ROUTES
const express = require('express');
const router = express.Router();
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

const moment = require('moment-timezone');

/* WP-API Customers Endpoint */
CMS.customers = CMS.registerRoute('wp/v2', '/customers/(?P<id>\\d+)/?(?P<field>[\\w\\-\\_]+)?');

/* WP-API Campaigns Endpoint */
CMS.campaigns = CMS.registerRoute('wp/v2', '/campaigns/(?P<id>\\d+)/?(?P<field>[\\w\\-\\_]+)?');

/* 
 * Returns an array with drinks' related information 
 * First gets campaign drinks info
 * Then gets customer's drinks info
 * 
 */
router.post('/drinks-data/', (req, res) => {
    /* customer's phone */
    const phone = req.body.phone;
    /* encrypted customer's phone number */
    let encryptedPhone = '';
    if (phone) {
        encryptedPhone = helper.encrypt(phone);
    }

    /* get customer by its slug (encrypted phone number) */
    const customerPromise = CMS.customers().slug(encryptedPhone);
    /* get campaign by its slug ('tennessee-honey') */
    const campaignPromise = CMS.campaigns().slug('tennessee-honey');

    /* resolve */
    Promise.all([customerPromise, campaignPromise])
        .then(data => {
            /* 
             * pass resolved promise data to variables, customer & campaign
             * customer and campaign promises return tables
             */
            const customer = data[0];
            const campaign = data[1];

            /* list with drink data for customer & campaign */
            const campaignList = campaign[0].acf.campaign_drinks;
            let customerList = [];
            /* get the list if customer's drink list is empty, populate it */
            if (customer[0].acf.drink_list) {
                customerList = customer[0].acf.drink_list;
            }
            /* if empty populate customer's drink with data */
            campaignList.forEach((value, key) => {
                if (!customerList[key]) {
                    customerList[key] = {};
                    /* initialize customer's drinks list  */
                    customerList[key].drink_status = '';
                    customerList[key].drink_time_stamp = null;
                    customerList[key].drink_is_redeemed = false;
                    customerList[key].drink_redeemed_at_bar = false;
                }
                customerList[key].drink_name = value.drink_name;
            });

            /* final list with combined drink data for customer & campaign, e.g. drinks redeemed from the customer, drinks expired etc */
            const drinksList = [];

            /* populate final drink list */
            campaignList.forEach((drink, key) => {
                /*
                 * drink availability is determined by it's status
                 * if drink's status is valid (true), then it is available
                 * if drink's status is locked (false), then it is unavailable
                 * default status is false, thus locked
                 */
                let availability = false;
                let status = 'locked';
                /* status determines the type of glass that would be rendered on the UI (valid/locked, used, expired) */
                let glass = 'list-glass';
                /* campaign duration legend from CMS */
                let legend = campaign[0].acf.campaign_duration;

                /* customer's drink data from customer's list */
                const customerDrink = customerList[key];

                /* check if customer drink has became available automatically by the cron-job on the CMS */
                if (customerDrink.hasOwnProperty('drink_status') && customerDrink.drink_status === 'valid') {
                    drink.drink_status = true;
                    legend = 'available ' + moment().format('Do MMMM');
                }
                /* Status: valid, expired or used */
                if (drink.drink_status) {
                    availability = true;
                    status = 'valid';
                } else {
                    /* Status: locked, legend displays when this drink would become available */
                    legend = drink.drink_legend;
                }
                /* check if customer has redeem the drink */
                if (customerDrink.drink_is_redeemed) {
                    status = customerDrink.drink_status;
                    availability = false;
                    glass = 'list-glass-used';
                    legend = 'used, ' + customerDrink.drink_time_stamp;
                } else {
                    /* check if drink offer has expired */
                    const now = new Date();
                    const expired = new Date(drink.drink_expiration_date);
                    if (now > expired) {
                        status = 'expired';
                        availability = false;
                        glass = 'list-glass-expired';
                        legend = 'expired, ' + drink.drink_expiration_date;
                    }
                }
                /* build final drink list */
                drinksList.push({
                    availability: availability,
                    status: status,
                    glass: glass,
                    name: drink.drink_name,
                    legend: legend
                });
            });
            return drinksList;
        })
        .then(data => res.json(data))
        .catch(error => res.status(500).json({
            'error': error
        }));
});

module.exports = router;