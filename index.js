
const request = require("request");
const fileExists = require('file-exists');

/***** IMPORT sender_config for userId, api Key and authentication key *****/
const sender_config = require('./authentications/sender_config.json');

/***** IMPORT all modules for perform operation on APIs *****/
const apiOperations = require('./modules/apiOperations.js');
const apisLogsOperations = require('./modules/apisLogsOperations.js');

oldApis = [];
newApis = [];



// ***** INSERT all apis in newApis.json
function insertAllApis (path, apis, callback) {
    const apisData = {
        apis: []
    };
    new Promise((result, err) => {
        apis.map((api) => {
            let urlsForDescription = ''
            for(let i = 0; i < api.num_resources; i++){
               urlsForDescription = urlsForDescription + api.resources[i].url + " / "
            }   
            const apiData = {
                'name': '0 - 0 ' + api.name,
                'description': api.notes + urlsForDescription,
                'url': "https://liityntakatalogi.suomi.fi",
                'lifecycleStatus': 'development',
                'isPublic': false,
                'documentationUrl': api.resources[0].url,
                'externalDocumentation':api.url,
                'updated_at': new Date(api.metadata_modified)
            };
            apisData.apis.push(apiData);
        });

        if (apis.length == apisData.apis.length) {
            result(apisData);
        }
    }).then((apisData) => {
        // ***** Store all apis in newApis.json
        newApis = apisData.apis || [];
        
        fileExists(path).then(exists => {
            if (exists) {
                apisLogsOperations.read(path, function (err, apisList) {
                    if (err) {
                        callback(err,null);
                    }else if (apisList && apisList.apis && apisData.apis.length != 0) {


                        apisData.apis.map((newApi) => {
                            const index = apisList.apis.findIndex((api) => api.name === newApi.name);
                            if (index == -1)
                                apisList.apis.push(newApi);
                            else
                                apisList.apis[index] = newApi;
                        });
                        apisLogsOperations.write(path, apisList, function (err,apisRes) {
                            if(err) return console.log(':: err in write ',err );
                            newApis = apisRes.apis || [];
                            callback(err,newApis);
                        });
                    } else {
                        callback('no apis found', false);
                    }
                });
            } else {
                apisLogsOperations.write(path, apisData, function (err,apisRes) {
                    if (err) callback(err, false);
                    else callback(null, apisRes.apis);
                });
            }
        });
    }).catch((err) => {
        callback(err,null);
    });
}

// ***** DELETE api from newApis.json
function deleteApiFromNewApis (path, api, callback) {
    const newApiIndex = newApis.findIndex(newApi => newApi.name === api.name);
    if (newApiIndex != -1) {
        newApis.splice(newApiIndex, 1);
        const apisData = {
            apis: newApis
        };
        apisLogsOperations.write(path, apisData, (err,res) => {
            callback(err,res);
        });
    } else {
        callback('no api fould in newApisList ',false);
    }
}





// ***** INSERT/UPDATE api in oldApis.json
function insertApiInOldApis (path, api, callback) {
    const apisData = {
        apis: []
    };
    try{
        // ***** Store all apis in oldApis.json
        fileExists(path).then(exists => {
            if (exists) {
                apisLogsOperations.read(path, function (err, oldApisList) {
                    if (err) {
                        callback(err, false);
                    }else if (oldApisList) {

                        // ***** FIND index of api in oldApisList
                        const index = oldApisList.apis.findIndex((oldApi) => oldApi.name === api.name);
                        if (index == -1)
                            oldApisList.apis.push(api);
                        else
                            oldApisList.apis[index] = api;

                        
                        // ***** WRITE all oldApis in oldApis.json file
                        apisLogsOperations.write(path, oldApisList, function (err,apisRes) {
                            if (err) {
                                callback(err, false);
                            } else {
                                oldApis = apisRes.apis || [];
                                callback(false,true);
                            }
                        });
                    } else {
                        callback('no apis found', false);
                    }
                });
            } else {
                apisData.apis.push(api);

                
                apisLogsOperations.write(path, apisData, function (err,apisRes) {
                    if (err) {
                        callback(err, false);
                    } else { 
                        oldApis = apisRes.apis || [];
                        callback(false, true);
                    }
                });
            }
        });
    } catch (err) {
        callback(err, false);   
    }
}

// ***** DELETE api from oldApis.json
function deleteApiFromOldApis (path, apiId, callback) {
    const oldApiIndex = oldApis.findIndex(oldApi => oldApi.id === apiId);
    if (oldApiIndex != -1) {
        oldApis.splice(oldApiIndex, 1);
        const apisData = {
            apis: oldApis
        };
        apisLogsOperations.write(path, apisData, (err,res) => {
            callback(err,res);
        });
    } else {
        callback('no api fould in oldApisList ',false);
    }
}







/***** Get all APIs function defination *****/
function getApis () {
    console.log('getting apis at '+ Date.now());    
    /***** USE request to perform the GET and POST operations *****/
    console.log(sender_config.sourceUrl)
    request(sender_config.sourceUrl, {json: true}, (err, res, body) => {
        if(err) return console.log(err);
        
        /***** INSERT all apis in file ---- START *****/
            insertAllApis(sender_config.path_newApisFile, body.result.results, (err,apis) => {
                if (err) return console.log(':: err while insert all apis ',err);
                /****************************** DELETE APIS ---- START **********************************/
                    if (oldApis.length != 0) {
                        diffApis = [];
                        oldApis.map((oldApi) =>{
                            const index = apis.findIndex((newApi) => newApi.name === oldApi.name);
                            if (index === -1) {

                                 /***** FIND extra apis from oldApis array and PUSH in diffApis array *****/
                                diffApis.push(oldApi)
                            }
                        })

                        if (diffApis.length > 0) {
                            diffApis.map( (api) => {
                                console.log(':: 3 ****DELETE***: ',api.name)

                                
                                /***** DELETE api from catalog ---- START *****/
                                    apiOperations.delete(api._id, (err, res) => {
                                        if (!err) {

                                            /***** REMOVE api in oldApis.json File ---- START *****/
                                                deleteApiFromOldApis(sender_config.path_oldApisFile, api._id, (err, res) => {
                                                    console.log(':: err1  update api in oldApis.json file ',err)
                                                    console.log(':: res1 update api in oldApis.json file ',res ? true: false )
                                                });
                                            /***** REMOVE api in oldApis.json File ---- END *****/
                                        }
                                    });
                                /***** DELETE api from catalog ---- END *****/


                            });
                        }
                    }
                /****************************** DELETE APIS ---- END *************************************/



                /****************************** INSERT/UPDATE APIS ---- START *****************************/
                    if (apis) {
                        apis.map((api) => {

                            /***** FIND index from oldApis *****/
                            const index = oldApis.findIndex(oldApi => oldApi.name === api.name);
                            if (index == -1) {
                                console.log(':: ****INSERT***: ',api.name)


                                /***** INSERT api in catalog ---- START *****/
                                    apiOperations.insert(api, (err, body) => {
                                        if (err) return console.log(':: err while insert ',err)
                                        
                                        console.log(':: insert ',`status: ${body.status}` || `body: ${body}`)

                                        if (body.status === 'success') {


                                            /***** INSERT api in oldApis.json File ---- START *****/
                                                insertApiInOldApis(sender_config.path_oldApisFile, body.data, (err, res) => {
                                                    console.log(':: err2  insert api in oldApis.json file ',err)
                                                    console.log(':: res2 insert api in oldApis.json file ',res ? true: false )
                                                });
                                            /***** INSERT api in oldApis.json File ---- END *****/


                                            /***** Remove api from newApis.json File ---- START *****/
                                                deleteApiFromNewApis(sender_config.path_newApisFile, body.data, (err,res) => {
                                                    console.log(':: err1  while newApis.json file udate during insert ',err)
                                                    console.log(':: res1 while newApis.json file udate during insert ',res ? true: false )
                                                });
                                            /***** Remove api from newApis.json File ---- END *****/


                                        }else if (body.message && body.message === 'Duplicate: API with same name already exists.' && body.id) {

                                            console.log(':: 2 ****UPDATE***: ',api.name)


                                            /***** UPDATE api in catalog ---- START *****/
                                                apiOperations.update(api, body.id, (err, body) => {
                                                    if (err) return console.log(':: err while insert ',err)

                                                    if (body && body.status == 'success' ){


                                                        /***** INSERT api in oldApis.json File ---- START *****/
                                                            insertApiInOldApis(sender_config.path_oldApisFile, body.data, (err, res) => {
                                                                console.log(':: err3  insert api in oldApis.json file ',err)
                                                                console.log(':: res3 insert api in oldApis.json file ',res ? true: false )
                                                            });
                                                        /***** INSERT api in oldApis.json File ---- END *****/


                                                        /***** Remove api from newApis.json File ---- START *****/
                                                            deleteApiFromNewApis(sender_config.path_newApisFile, body.data, (err,res) => {
                                                                console.log(':: err2  while newApis.json file udate during insert ',err)
                                                                console.log(':: res2 while newApis.json file udate during insert ',res ? true: false )
                                                            });
                                                        /***** Remove api from newApis.json File ---- END *****/

                                                    }
                                                });
                                            /***** UPDATE API api in catalog ---- END *****/


                                        }
                                    });
                                /***** INSERT api in catalog ---- END *****/


                            } else {

                                // ***** CHECK updated date of api changed or not
                                if(api.updated_at > oldApis[index].updated_at) {
                                    console.log(':: 1 ****UPDATE***: ',api.name)
                    
                                    /***** UPDATE api in catalog ---- START *****/
                                        apiOperations.update(api, oldApis[index]._id, (err, body) => {
                                            if (err) return console.log(':: err while insert ',err)

                                            if (body && body.status == 'success' ){

                                                /***** REPLACE old api data with updated data in oldApis.json File ---- START *****/
                                                    insertApiInOldApis(sender_config.path_oldApisFile, body.data, (err, res) => {
                                                        console.log(':: err3  insert api in oldApis.json file ',err)
                                                        console.log(':: res3 insert api in oldApis.json file ',res ? true: false )
                                                    });
                                                /***** REPLACE old api data with updated data in oldApis.json File ---- END *****/


                                                /***** Remove api from newApis.json File ---- START *****/
                                                    deleteApiFromNewApis(sender_config.path_newApisFile, body.data, (err,res) => {
                                                        console.log(':: err3 while newApis.json file udate during insert ',err)
                                                        console.log(':: res3 while newApis.json file udate during insert ',res ? true: false )
                                                    });
                                                /***** Remove api from newApis.json File ---- END *****/


                                            }
                                        });
                                    /***** UPDATE api in catalog ---- END *****/


                                } else {
                                    /***** Remove api from newApis.json File ---- START *****/
                                        deleteApiFromNewApis(sender_config.path_newApisFile, api, (err,res) => {
                                            console.log(':: err4 while newApis.json file udate during insert ',err)
                                            console.log(':: res4 while newApis.json file udate during insert ',res ? true: false )
                                        });
                                    /***** Remove api from newApis.json File ---- END *****/
                                }
                            }
                        });
                    }
                /****************************** INSERT/UPDATE APIS ---- END *******************************/


            });
        /***** INSERT all apis in file ---- END *****/


    });
}


function start () {
    console.log(':: starting.. setting up cron job')     
    var CronJob = require('cron').CronJob;
    new CronJob(sender_config.cronJobDefinition, function(){	
    
    /***** GET all apis function calling *****/
      getApis ();
    }, null, true, 'America/Los_Angeles');
}

// start app
start ();
