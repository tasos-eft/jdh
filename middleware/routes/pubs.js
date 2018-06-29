/*jshint esversion: 6 */

const express = require('express');
const router = express.Router();
const WPAPI = require('wpapi');
const cache = require('memory-cache');
const _ = require('underscore');
/* mongoDB database */
const db = require('../utilities/mongodb-utility');
/* custom helpers */
const helper = require('../utilities/helper');

// Generic error handler used by all endpoints.
const handleError = (res, reason, message, code) => {
    res.status(500).json({
        'error': message,
        'reason': reason
    });
};
/* WP-API connect to the api */
const CMS = new WPAPI({
    endpoint: helper.constants.endpoint,
    username: helper.constants.username,
    password: helper.constants.password
});

/* WP-API Campaigns Endpoint */
CMS.campaigns = CMS.registerRoute('wp/v2', '/campaigns/(?P<id>\\d+)/?(?P<field>[\\w\\-\\_]+)?');

/* WP-API Customers Endpoint */
CMS.customers = CMS.registerRoute('wp/v2', '/customers/(?P<id>\\d+)/?(?P<field>[\\w\\-\\_]+)?');

/* ACF custom route */
CMS.acfPosts = CMS.registerRoute('acf/v3', '/posts/(?P<id>\\d+)/?(?P<field>[\\w\\-\\_]+)?');

/* 
 * Each time a new WP customer, (custom post type) is created, 
 * customer's mobile phone becomes the main identification tool.  
 */

/* 
 * create an array of promises for post data and media data
 * concat two arrays, post data first 
 * [0] - [length/2] post data
 * [length/2] - [length/] media data
 */


/* 
 * https://medium.com/the-node-js-collection/simple-server-side-cache-for-express-js-with-node-js-45ff296ca0f0
 * cache pubs response for a certain period of time
 */
const dataCache = duration => {
    return (req, res, next) => {
        const key = '__pubs__' + req.originalUrl || req.url;
        let cachedBody = cache.get(key);
        if (cachedBody) {
            res.send(cachedBody);
            return;
        } else {
            res.sendResponse = res.send;
            res.send = (body) => {
                cache.put(key, body, duration);
                res.sendResponse(body);
            };
        }
        next();
    };
};

/* a day in ms 8.64e7; */
const day = 24 * 60 * 60 * 1000;

router.get('/wp-api-pubs/', dataCache(day), (req, res) => {
    /* get all bars */
    CMS.posts().embed().perPage(100).order('asc').orderby('title')
        .then(bars => {
            bars.map(bar => bar.media_url = bar._embedded['wp:featuredmedia'][0].media_details.sizes.medium.source_url);
            res.json(bars);
        })
        .catch(error => res.json(error));
});

/* 
 * customer orders a drink in a pub, customer's phone, pub's id & drink index come from request
 * on successful redemption, fullfil promises:  
 * a) updates user meta data
 * b) updates pub, appends user on customer_redemption_list
 * acfData function determines which metadata set should be updated, 
 * by checking drink index (1st, 2nd, 3rd, 4th)
 */

const acfData = (index, bar, customer, campaign) => {
    let metadata = {};
    const now = new Date();

    /* 
     * get the list with customer's drink info 
     * if the list is empty, create a new array
     * populate the list with data     
     */

    /* init customer drink list as an array since it might be empty */
    let customerDrinks = [];
    const barDrinks = campaign.acf.campaign_drinks;
    /* get the list */
    if (customer.acf.drink_list) {
        customerDrinks = customer.acf.drink_list;
    }
    /* 
     * populate the list with data. Drink name for customers' ACF is the same as the drink name of the campaign. 
     * other data, as status timestamp and drink redemption info are set after a successful redemption
     */

    barDrinks.forEach((campaignDrink, key) => {
        if (!customerDrinks[key]) {
            customerDrinks[key] = {};
            /* initialize customer's drinks list  */
            customerDrinks[key].drink_status = '';
            customerDrinks[key].drink_time_stamp = null;
            customerDrinks[key].drink_is_redeemed = false;
            customerDrinks[key].drink_redeemed_at_bar = false;
        }
        /* change redemption related data */
        if (key === index) {
            customerDrinks[key].drink_status = 'used';
            customerDrinks[key].drink_time_stamp = now;
            customerDrinks[key].drink_is_redeemed = true;
            customerDrinks[key].drink_redeemed_at_bar = bar;
        }
        customerDrinks[key].drink_name = campaignDrink.drink_name;
    });

    metadata = {
        fields: {
            drink_list: customerDrinks
        }
    };

    return metadata;
}

router.post('/order-drink/', (req, res) => {
    /* pub id */
    const pubID = req.body.id;
    /* customer's phone */
    const phone = req.body.phone;
    /* encrypted customer's phone number */
    let encryptedPhone = '';
    if (phone) {
        encryptedPhone = helper.encrypt(phone);
    }

    /* drink index, e.g. first, second, third or fourth */
    const drinkIndex = req.body.index;
    /* parse index to integer, it would be used as a pointer */
    const parsedIndex = parseInt(drinkIndex, '10');

    /* get target pub */
    const pubPromise = CMS.posts().id(pubID);
    /* get customer by its slug (encrypted phone number) */
    const customerPromise = CMS.customers().slug(encryptedPhone);
    /* get campaign by its slug ('tennessee-honey') */
    const campaignPromise = CMS.campaigns().slug('tennessee-honey');

    /* resolve */
    Promise.all([pubPromise, customerPromise, campaignPromise])
        .then(data => {
            /* 
             * pass resolved promise data to variables, pub customer & campaign
             * pub promise returns an object, but customer and campaign promises return tables
             */
            const pub = data[0];
            const customer = data[1];
            const campaign = data[2];

            /* array bar drinks */
            const barDrinksPerCampaign = pub.acf.bar_drinks_per_campaign;
            /* drinks left at a bar */
            let drinksLeft = 0;
            drinksLeft = parseInt(barDrinksPerCampaign[0].drinks_cap, 10) - parseInt(barDrinksPerCampaign[0].redeemed_drinks, 10);

            let nextStep = null;
            if (drinksLeft > 0) {
                /* append current customer id on pub's customers list */
                let redemptionList = [];
                let list = [];
                if (pub.acf.customer_redemption_list) {
                    redemptionList = pub.acf.customer_redemption_list;
                }
                redemptionList.forEach(element => {
                    list.push(element.ID);
                });
                list.push(customer[0].id);
                /* 
                 * probably not necessary 
                 * list = _.uniq(list);
                 */
                /* update pub acf */
                const updatePub = CMS.acfPosts().id(pubID)
                    .update({
                        fields: {
                            customer_redemption_list: list
                        }
                    });

                /* update customer acf meta data */
                const metadata = acfData(parsedIndex, pubID, customer[0], campaign[0]);
                const updateCustomer = CMS.acfPosts().id(customer[0].id).update(metadata);
                /* array contains promises on update requests for customer and pub */
                nextStep = Promise.all([updatePub, updateCustomer]);
            }
            return nextStep;
        })
        .then(data => res.json(data))
        .catch(error => {
            res.json(error);
        });
});


/* OLD GET PUBS CALL */
router.get('/wp-api-pubs-old/', dataCache(7 * day), (req, res) => {
    /* get campaign by its slug ('tennessee-honey') */
    const campaignPromise = CMS.campaigns().slug('tennessee-honey');
    /* get bars that participate on this campaign */
    campaignPromise
        .then(campaign => {
            /* list of ids (array) with bars participating on a campaign */
            bars = campaign[0].acf.campaign_bars;
            const posts = [];
            bars.forEach(bar => {
                posts.push(Promise.resolve(CMS.posts().id(bar)));
            });
            return Promise.all(posts);
        })
        .then(posts => {
            const postArray = [];
            const mediaArray = [];
            posts.forEach(post => {
                postArray.push(Promise.resolve(CMS.posts().id(post.id)));
                mediaArray.push(Promise.resolve(CMS.media().id(post.featured_media)));
            });
            const promiseArray = postArray.concat(mediaArray);
            return Promise.all(promiseArray);
        })
        .then(dataArray => {
            /* add featured media url on post object */
            const posts = [];
            const half = dataArray.length / 2;
            const enhancedPosts = [];

            dataArray.forEach((element, index) => {
                if (index < half) {
                    /* post */
                    enhancedPosts.push(element);
                } else {
                    /* add media url to post object */
                    enhancedPosts[index - half].media_url = element.source_url;
                    const img = new Image();
                    img.src = element.source_url;
                    console.log('w', img.width);
                    console.log('h', img.height);

                }
            });
            res.json(enhancedPosts);
        }).catch(error => res.json(error));
});
/* OLD GET PUBS CALL */

module.exports = router;