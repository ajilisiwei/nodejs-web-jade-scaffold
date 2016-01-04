'use strict';

const merge = require('deepmerge');
const validator = require('validator');
const UserSchema = require('../models/user');

const _getQuery = (info) => {
    const query = {$or: []};
    if (info.user_name && info.password) {
        query.$or.push({
            user_name: info.user_name,
            password: info.password
        });
    }
    if (info.email) query.$or.push({email: info.email});
    if (info.facebook_id) query.$or.push({facebook_id: info.facebook_id});
    if (info.twitter_id) query.$or.push({twitter_id: info.twitter_id});
    if (info.google_id) query.$or.push({google_id: info.google_id});
    if (info.github_id) query.$or.push({github_id: info.github_id});

    return query;
};

module.exports = {

    /**
     * Resolve User
     */
    resolveUser: (userInfo, callback) => {
        const isLocal = userInfo.isLocal;
        delete userInfo.isLocal;

        UserSchema.findOne(_getQuery(userInfo), (err, user) => {
            if (err) {
                return callback(err);
            }

            if (isLocal) {
                if (!user) {
                    return callback(null, false, {type: 'danger', message: 'auth.failed'});
                }

                return callback(null, user);
            }

            let comparator = merge(userInfo, user || {});
            if (user) {
                if (JSON.stringify(user) !== JSON.stringify(comparator)) {
                    comparator.save((err, user) => {
                        if (err) {
                            return callback(err);
                        }

                        return callback(null, user);
                    });
                } else {
                    callback(null, user);
                }
            } else {
                if (!comparator.user_name && comparator.email && validator.isEmail(comparator.email)) {
                    comparator.user_name = comparator.email.split('@')[0];
                }
                user = new UserSchema(comparator);

                user.save((err, user) => {
                    if (err) {
                        return callback(err);
                    }

                    callback(null, user);
                });
            }
        });
    }
};