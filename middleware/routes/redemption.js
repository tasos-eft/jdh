/*jshint esversion: 6 */

const express = require('express');
const router = express.Router();
const WPAPI = require('wpapi');
/* custom helpers */
const helper = require('../utilities/helper');

/* WP-API connect to the api */
const CMS = new WPAPI({
    endpoint: helper.constants.endpoint,
    username: helper.constants.username,
    password: helper.constants.password
});

CMS.customers = CMS.registerRoute('wp/v2', '/customers/(?P<id>\\d+)/?(?P<field>[\\w\\-\\_]+)?');

router.post('/redemption-data/', (req, res) => {
    /* pub id */
    const id = req.body.id;

    const postPromise = CMS.posts().id(id);

    CMS.posts().id(id)
        .then(data => {
            /* pub data */
            const pub = data;
            res.json({ pub_title: pub.title.rendered });
        })
        .catch(error => res.status(500).json({ 'error': error }));
});

module.exports = router;