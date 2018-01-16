
const request = require("request");

/***** IMPORT sender_config for userId, api Key and authentication key *****/
const sender_config = require('../authentications/sender_config.json');

module.exports  = {
    insert: function (api, callback) {
        //use this to collect the URLs
        request.post({
            headers:{
                'X-Api-Key':sender_config.apiKey,
                'X-Auth-Token': sender_config.authToken,
                'X-User-Id':sender_config.userId
            },
            url: `${sender_config.sinkUrl}`,
            body: api,
            json: true
        }, function(err, resp, body){
            callback(err, body);              
        });
    },
    update: function (api, id, callback) {
        console.log(':: update id ',id)
        console.log(':: update api ',api.name)
        request.put({
            headers:{
                'X-Api-Key':sender_config.apiKey,
                'X-Auth-Token': sender_config.authToken,
                'X-User-Id':sender_config.userId
            },
            url: `${sender_config.sinkUrl}${id}`,
            form: api
        }, function(err, resp, body){
            const data = JSON.parse(body);
            console.log(':: update status ',data.status ||  data)
            callback(err, JSON.parse(body));
        });
    },
    delete: function (id, callback) {
        console.log(':: delete id ',id)
        // get index of deleted api from old apis data
        request.delete({
            headers:{
                'X-Api-Key':sender_config.apiKey,
                'X-Auth-Token': sender_config.authToken,
                'X-User-Id':sender_config.userId
            },
            url: `${sender_config.sinkUrl}${id}`,
        }, function(err, resp, body){
            callback(err, body);
        });
    },
};
