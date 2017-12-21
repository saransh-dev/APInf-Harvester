const fs = require('file-system');

module.exports  = {
    read: function(path, callback) {
        new Promise((result, revoke) => {
            result(fs.readFileSync(path, 'utf8'));
        }).then((apis) => {
            let apisList = {};
            if(apis)
                apisList = JSON.parse(apis);
            else
                apisList = {
                    apis:[],
                };
            callback(null, apisList)
        }).catch((err) => {
            callback(err, null)
        });
        
    },
    write: function(path,api, callback) {
        try {
            fs.writeFileSync(path, JSON.stringify(api),'utf8');
            callback(null, api);
        } catch (err) {
            callback(err, null);
        }
    }
};
