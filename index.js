
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
            console.log ( "NEW APIS **************** INSERT api from newApis.json File ",api.name)
            let urlsForDescription = ''
            let description = api.notes + "  ";
            for(let i = 0; i < api.num_resources; i++){
                if (description.length < 1000 && (description.length + api.resources[i].url.length <= 997))
                description = description + api.resources[i].url + " / "
            }
            const apiData = {
                'name': '0 ' + api.name,
                'description': description,
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
                    }else if (apisList && apisList.apis) {
                        if (apisData.apis.length != 0) {


                            apisData.apis.map((newApi) => {
                                const index = apisList.apis.findIndex((api) => api.name === newApi.name);
                                if (index == -1)
                                    apisList.apis.push(newApi);
                                else
                                    apisList.apis[index] = newApi;
                            });
                        }
                        apisLogsOperations.write(path, apisList, function (err,apisRes) {
                            if(err){
                                console.log(':: 1 ===> error length return after write in newApis.json file ',err)
                                callback(err, false);
                            } else if (apisRes && apisRes.apis) {
                                console.log(':: 1 ===> apisRes length return after write in newApis.json file ',apisRes.apis.length)
                                newApis = apisRes && apisRes.apis ? Object.assign([],apisRes.apis) : [];
                                callback(false,apisRes.apis);    
                            } else {
                                callback ('no apis while write in file', false);
                            }
                        });

                    } else {
                        callback('no apis found', false);
                    }
                });
            } else {
                apisLogsOperations.write(path, apisData, function (err,apisRes) {
                    if(err){
                        console.log(':: 2 ===> error length return after write in newApis.json file ',err)
                        callback(err, false);
                    } else if (apisRes && apisRes.apis) {
                        console.log(':: 2 ===> apisRes length return after write in newApis.json file ',apisRes.apis.length)
                        newApis = apisRes && apisRes.apis ? Object.assign([],apisRes.apis) : [];
                        callback(false,apisRes.apis);    
                    } else {
                        callback ('no apis while write in file', false);
                    }
                });
            }
        });
    }).catch((err) => {
        callback(err,null);
    });
}

// ***** DELETE api from newApis.json
function deleteApiFromNewApis (path, api, callback) {
    console.log ( "NEW APIS **************** Remove api from newApis.json File ",api.name)
    const apis = newApis;
    const newApiIndex = apis.findIndex(newApi => newApi.name === api.name);
    if (newApiIndex != -1) {
        apis.splice(newApiIndex, 1);
        const apisData = {
            apis: apis
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
    console.log ( "OLD APIS **************** INSERT api from oldApis.json File ",api.name)
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
                        else{
                            oldApisList.apis[index] = api;
                        }

                        
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
    const oldApiIndex = oldApis.findIndex(oldApi => oldApi._id === apiId);
    if (oldApiIndex != -1) {
        console.log ( "OLD APIS **************** Remove api from newApis.json File ",oldApis[oldApiIndex].name)
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



/***** Get all new APIs function defination *****/
function getNewApis () {
    console.log('getting apis at '+ Date.now());    
    /***** USE request to perform the GET and POST operations *****/
    console.log(sender_config.sourceUrl)
    request(sender_config.sourceUrl, {json: true}, (err, res, body) => {
        if (err) return console.log(err);
        console.log(':: ===> body results ',body.result && body.result.results ? body.result.results.length : `no body results apis ==> ${body}`)
        if (body.result && body.result.results) {
            /***** INSERT all apis in file ---- START *****/
                insertAllApis(sender_config.path_newApisFile, body.result.results, (err,apis) => {
                    if (err) return console.log(':: err while insert all apis ',err);
                    /****************************** DELETE APIS ---- START **********************************/
                        if (oldApis.length != 0) {
                            diffApis = [];
                            oldApis.map((oldApi) =>{
                                const index = apis.findIndex((newApi) => newApi.name === oldApi.name);
                                console.log('::: ====> index of ',oldApi.name,' is ',index)
                                if (index === -1) {

                                     /***** FIND extra apis from oldApis array and PUSH in diffApis array *****/
                                    diffApis.push(oldApi)
                                }
                            })

                            if (diffApis.length > 0) {
                                diffApis.map( (apiForDelete) => {
                                    console.log(':: 1 ****DELETE***: ',apiForDelete.name)

                                    
                                    /***** DELETE api from catalog ---- START *****/
                                        apiOperations.delete(apiForDelete._id, (err, res) => {
                                            
                                            if (err) {
                                                console.log(':: ==> Error on delete apis ==> ',err)
                                            } else {
                                                console.log(':: ==> Response on delete apis ==> ',res)
                                                /***** REMOVE api in oldApis.json File ---- START *****/
                                                    deleteApiFromOldApis(sender_config.path_oldApisFile, apiForDelete._id, (err, res) => {
                                                        if (err)
                                                            console.log(':: err1 for ***',apiForDelete._id,'***  update api in oldApis.json file ',err)
                                                        else
                                                            console.log(':: res1 for ***',apiForDelete._id,'*** update api in oldApis.json file ',res ? true: false )
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
                        if (apis && apis.length != 0) {
                            console.log(':: *********** APIS length get from newApis.json ',apis.length)
                            apis.map((api) => {

                                /***** FIND index from oldApis *****/
                                const index = oldApis.findIndex(oldApi => oldApi.name === api.name);
                                console.log(':: index of ',api.name,' is ==> ',index)
                                if (index == -1) {
                                    console.log(':: 1 ****INSERT***: ',api.name)


                                    /***** INSERT api in catalog ---- START *****/
                                        apiOperations.insert(api, (err, body) => {
                                            if (err) return console.log(':: err while insert ',err)
                                            
                                            console.log(':: insert ',body.status && body.status == "success" ?`status: ${body.status}` : `body: ${JSON.stringify(body)}`)

                                            if (body.status === 'success') {


                                                /***** INSERT api in oldApis.json File ---- START *****/
                                                    insertApiInOldApis(sender_config.path_oldApisFile, body.data, (err, res) => {
                                                        if (err)
                                                            console.log(':: err2  insert api in oldApis.json file ',err)
                                                        else
                                                            console.log(':: res2 insert api in oldApis.json file ',res ? true: false )
                                                    });
                                                /***** INSERT api in oldApis.json File ---- END *****/


                                                /***** Remove api from newApis.json File ---- START *****/
                                                    deleteApiFromNewApis(sender_config.path_newApisFile, body.data, (err,res) => {
                                                        if (err)
                                                            console.log(':: err1  while newApis.json file udate during insert ',err)
                                                        else
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
                                                                    if (err)
                                                                        console.log(':: err3  insert api in oldApis.json file ',err)
                                                                    else
                                                                        console.log(':: res3 insert api in oldApis.json file ',res ? true: false )
                                                                });
                                                            /***** INSERT api in oldApis.json File ---- END *****/


                                                            /***** Remove api from newApis.json File ---- START *****/
                                                                deleteApiFromNewApis(sender_config.path_newApisFile, body.data, (err,res) => {
                                                                    if (err)
                                                                        console.log(':: err2  while newApis.json file udate during insert ',err)
                                                                    else
                                                                        console.log(':: res2 while newApis.json file udate during insert ',res ? true: false )
                                                                });
                                                            /***** Remove api from newApis.json File ---- END *****/

                                                        } else {
                                                            console.log(':: 2 Else part for ',api.name ,' api update operation ',body)
                                                        }
                                                    });
                                                /***** UPDATE API api in catalog ---- END *****/


                                            } else {
                                                console.log(':: Else part for ',api.name ,' api insert operation ',body)
                                            }
                                        });
                                    /***** INSERT api in catalog ---- END *****/


                                } else {
                                    console.log('******* UPDATE CONDTIONS for', api.name,' ********** new Date ****** ',api.updated_at,' *****')
                                    console.log('******* UPDATE CONDTIONS for', oldApis[index].name,' ********** old Date ****** ',oldApis[index].updated_at,' *****')
                                    
                                    // ***** CHECK updated date of api changed or not
                                    if(new Date(api.updated_at).getTime() !== new Date(oldApis[index].updated_at).getTime()) {
                                        
                                        console.log(':: 1 ****UPDATE***: ',api.name)
                        
                                        /***** UPDATE api in catalog ---- START *****/
                                            apiOperations.update(api, oldApis[index]._id, (err, body) => {
                                                if (err) return console.log(':: err while insert ',err)
                                                if (body && body.status == 'success' ){

                                                    /***** REPLACE old api data with updated data in oldApis.json File ---- START *****/
                                                        insertApiInOldApis(sender_config.path_oldApisFile, body.data, (err, res) => {
                                                            if (err)
                                                                console.log(':: err3  insert api in oldApis.json file ',err)
                                                            else
                                                                console.log(':: res3 insert api in oldApis.json file ',res ? true: false )
                                                        });
                                                    /***** REPLACE old api data with updated data in oldApis.json File ---- END *****/


                                                    /***** Remove api from newApis.json File ---- START *****/
                                                        deleteApiFromNewApis(sender_config.path_newApisFile, body.data, (err,res) => {
                                                            if (err)
                                                                console.log(':: err3 while newApis.json file udate during insert ',err)
                                                            else
                                                                console.log(':: res3 while newApis.json file udate during insert ',res ? true: false )
                                                        });
                                                    /***** Remove api from newApis.json File ---- END *****/


                                                } else {
                                                    console.log(':: 1 Else part for ',api.name ,' api update operation ',body)
                                                }
                                            });
                                        /***** UPDATE api in catalog ---- END *****/


                                    } else {
                                        /***** Remove api from newApis.json File ---- START *****/
                                            deleteApiFromNewApis(sender_config.path_newApisFile, api, (err,res) => {
                                                if (err)
                                                    console.log(':: err4 while newApis.json file udate during insert ',err)
                                                else
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
        }

    });
}


/***** Get all old APIs function defination *****/
function getOldApis(path, callback) {
    try{
        fileExists(path).then(exists => {
            if (exists) {
                apisLogsOperations.read(path, function (err, apisList) {
                    console.log(':: 1 oldApis length ',apisList.apis ? apisList.apis.length : 'no apis')
                    if (err) {
                        callback(err,null);
                    }else if (apisList && apisList.apis && apisList.apis.length != 0) {
                        apisList.apis.map((api) => {
                            const index = oldApis.findIndex((oldApi) => oldApi.name === api.name);
                            if (index == -1)
                                oldApis.push(api);
                            else
                                oldApis[index] = api;
                        });
                        console.log('::in getOldApis, find oldApis length ',oldApis.length)
                        callback(false, 'old apis found ')
                    } else {
                        callback(false, 'no apis found');
                    }
                });
            } else {
                callback(false,'no file found with name oldApis.json');
            }
        });
    } catch (error) {
        callback(error, false);
    }
}


function start () {
    console.log(':: starting.. setting up cron job')     
    var CronJob = require('cron').CronJob;
    new CronJob(sender_config.cronJobDefinition, function(){
        /***** GET all apis function calling *****/
        getOldApis (sender_config.path_oldApisFile,(err, res) => {
            if (err || !res)
                return console.log(':: Error while fetching oldApis from oldApis.json => ** ',err,' **');
            else{
                console.log(':: Res while fetching oldApis from oldApis.json => ** ',res,' **')
                getNewApis();
            }
        });
    }, null, true, 'America/Los_Angeles');
}

// start app
start ();
