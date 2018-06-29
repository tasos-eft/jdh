/*jshint esversion: 6 */

const buffer = require('buffer');
const crypto = require('crypto');

const algorithm = 'aes-256-ctr';
const password = 'c7&CeYeW-rU8aS^e6aS%uy+4W1je3u&A';
const vector = 'C$5q6$rATe3$Q6$a';

module.exports.constants = {
    /* 
     * * * * MONGODB * * * *
     */
    dbUri: process.env.MONGOLAB_GRAY_URI,
    dbName: process.env.DB_NAME,
    /* 
     * * * * TWILIO * * * *
     */
    sid: process.env.TWILIO_ACCOUNT_SID,
    token: process.env.TWILIO_AUTH_TOKEN,
    number: process.env.TWILIO_NUMBER,
    /* 
     * * * * WP-API * * * *
     */
    endpoint: process.env.WP_API_ENDPOINT,
    username: process.env.WP_API_USERNAME,
    password: process.env.WP_API_PASSWORD
};

/* https://blog.tompawlak.org/generate-random-values-nodejs-javascript */

module.exports.pinGenerator = () => {
    const alphabet = '0123456789';

    const randomizer = crypto.randomBytes(4);
    const result = new Array(4);

    for (let i = 0; i < 4; i++) {
        result[i] = alphabet[randomizer[i] % alphabet.length];
    }

    return result.join('');
};

module.exports.passwordGenerator = () => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789~!@#$%^&*()_+';
    const randomizer = crypto.randomBytes(24);
    const result = new Array(24);

    for (let i = 0; i < 24; i++) {
        result[i] = alphabet[randomizer[i] % alphabet.length];
    }

    return result.join('');
};

module.exports.transform = content => {
    return content.replace('&amp;', '\&').replace('&ndash;', '\-').replace('&#8217;', '\'');
};

// Part of https://github.com/chris-rock/node-crypto-examples && https://stackoverflow.com/questions/44031377/nodejs-createcipher-vs-createcipheriv

module.exports.encrypt = input => {
    const cipher = crypto.createCipheriv('aes-256-cbc', new Buffer(password), new Buffer(vector));
    let output = cipher.update(input, 'utf8', 'hex');
    output += cipher.final('hex');
    return output;
}

module.exports.decrypt = input => {
    const decipher = crypto.createDecipheriv('aes-256-cbc', new Buffer(password), new Buffer(vector));
    let output = decipher.update(input, 'hex', 'utf8')
    output += decipher.final('utf8');
    return output;
}