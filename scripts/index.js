#!/usr/bin/env node

require('es6-promise').polyfill();
require('isomorphic-fetch');

//console.log("id: ",require('node-machine-id').machineIdSync());

// get the provided args
const [,,...args] = process.argv;

/*
const urlPath = "https://yfse1b9v0m.execute-api.eu-west-1.amazonaws.com/dev/data";

const params = {
    method: "POST",

    headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "Accept-Charset": "utf-8"
    }
};*/

if (args.length > 0) {
    ;(async () => {

        require('../dist/libs/scripts-libs').fetchData(args[0], {});

        /*
        await fetch(urlPath,
            Object.assign({
                body: JSON.stringify({
                    orig: require('node-machine-id').machineIdSync(),
                    occa: args[0],
                    vers: process.env.npm_package_version
                })
            }, params)
        ).then(result => {
            console.log("post result: ", result);
        }).catch(error => {
            console.error("post-error: ", error);
        });
         */
    })();


}




//const uuidv4 = require('uuid/v4');
//fs.writeFileSync(path.resolve(__dirname, "..", "installation.txt"), uuidv4());
