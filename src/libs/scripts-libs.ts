
require('es6-promise').polyfill();
require('isomorphic-fetch');

import { machineIdSync } from 'node-machine-id';


export async function fetchData (occa: string, data: any) {
    const urlPath = "https://ya7mle28zb.execute-api.eu-west-1.amazonaws.com/dev/data";

    const params = {
        method: "POST",

        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
            "Accept-Charset": "utf-8"
        }
    };

    return await fetch(urlPath,
        Object.assign({
            body: JSON.stringify(Object.assign({
                    orig: machineIdSync(),
                    time: Math.round(+new Date()/1000),
                    occa: occa,
                    cacredential: process.env.CODE_ARCHITECT_ACCESS
                },
                occa !== "install" ?  {} : {vers: process.env.npm_package_version},
                data)
            )
        }, params)
    ).then(result => {
        console.log("post result: ", result);
        return result;
    }).catch(error => {
        //console.error("post-error: ", error);
        return {};
    });

}