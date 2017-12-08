const request = require('request');
// import sender_config for userId, api Key and authentication key
const sender_config = require('./authentications/sender_config.json');
// For store old api data
let oldApis = [];

// Update api by id
function updateApi (api, index) {
    request.put({
        headers:{
            'X-Api-Key':sender_config.apiKey,
            'X-Auth-Token': sender_config.authToken,
            'X-User-Id':sender_config.userId
        },
        url: `${sender_config.url}${api._id}`,
        form: api
    }, function(err, resp, body){
        if (err){
            return console.log(err);
        } else  if (body && body.status == 'success' ){
            // replace old api data with updated data
            oldApis[index] = body.data;
        }

    });
}


// Delete APIs
function deleteApi (id) {
    console.log(':: id ',id)
    request.delete({
        headers:{
            'X-Api-Key':sender_config.apiKey,
            'X-Auth-Token': sender_config.authToken,
            'X-User-Id':sender_config.userId
        },
        url: `${sender_config.url}${id}`,
    }, function(err, resp, body){
        
            if (err){
                return console.log(':: err ',err);
            } else {
                // get index of deleted api from old apis data
                const index = oldApis.findIndex(api => api._id === id);
                // reomved api data from old apis data
                oldApis.splice(index, 1)
            }
            
    });
}

// Insert all APIs
function insertApi (api) {
    const jsonData = {
        'name': '00 00 000 0000 ' + api.name,
        'description': 'no description',
        'url': "https://liityntakatalogi.suomi.fi",
        'lifecycleStatus': 'development',
        'isPublic': false,
        'documentationUrl': api.resources[0].url,
        'externalDocumentation':api.url
    };
    request.post({
         headers:{
            'X-Api-Key':sender_config.apiKey,
            'X-Auth-Token': sender_config.authToken,
            'X-User-Id':sender_config.userId
        },
        url: `${sender_config.url}`,
        body: jsonData,
        json: true
    }, function(err, resp, body){
            if (err){
                return console.log(':: err ',err);
            } else {
                // check condition api exists or not
                if (body.message === 'Duplicate: API with same name already exists.') {
                    // get api index from old apis data 
                    const index = oldApis.findIndex(api => api.name === jsonData.name);
                    // check update api exists in old api or not
                    if (index > -1) {
                        // Request for update
                        updateApi(jsonData, index);
                    }
                } else if (body.status === 'success') {
                    // insert insert api data in old apis data
                    oldApis.push(body.data);
                }
            }
            
    });
}


// Get all APIs
function getApis () {
    //use request to perform the GET and POST operations
    request('https://liityntakatalogi.suomi.fi/api/action/package_search', {json: true}, (err, res, body) => {
        if(err) return console.log(err);
        body.result.results.map ((api) => {
            // insert all apis
            insertApi (api);
        });

        // initial a value for getting different api
        let diffApis = [];
        oldApis.map((oldApi) => {
            // find index of api from old apis on the basis of api's name
            const index = body.result.results.findIndex(newApi => newApi.name === oldApi.name);
            // if old api not exists in new api then store that api in diffApis array
            if (index == -1) diffApis.push(oldApi);
        });
        if (diffApis.length > 0) {
            diffApis.map( (api) => {
                // delete all extra apis from old apis
                deleteApi (api._id);
            });
        }


    });
}


function start () {
    // console.log('start')
     
    var CronJob = require('cron').CronJob;
    new CronJob('* * 10 * * *', function() {
    // get all apis;
      getApis ();
    }, null, true, 'America/Los_Angeles');
}

// start app
start ();