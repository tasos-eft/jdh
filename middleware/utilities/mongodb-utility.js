/*jshint esversion: 6 */

/* https://www.terlici.com/2015/04/03/mongodb-node-express.html */

const MongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');

/* custom helpers */
const helper = require('./helper');

const state = {
    db: null,
};


exports.connect = (url, done) => {
    if (state.db) return done();

    MongoClient.connect(url, (error, database) => {
        /* error */
        if (error) return done(error);
        /* connect  https://stackoverflow.com/questions/43779323/typeerror-db-collection-is-not-a-function */
        state.db = database.db(helper.constants.dbName);;
        done();
    });
};

exports.get = () => {
    return state.db;
};

exports.close = done => {
    if (state.db) {
        state.db.close(function(err, result) {
            state.db = null;
            state.mode = null;
            done(err);
        });
    }
};