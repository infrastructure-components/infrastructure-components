
require('es6-promise').polyfill();
require('isomorphic-fetch');

import { machineIdSync } from 'node-machine-id';


export async function fetchData (occa: string, data: any) {
    const urlPath = " https://www.code-architect.com/data";

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
                    occa: occa
                },
                occa !== "install" ?  {} : {vers: process.env.npm_package_version},
                data)
            )
        }, params)
    ).then(response => {
        //console.log("post result: ", response);
        return response.text();
    }).catch(error => {
        //console.error("post-error: ", error);
        return {};
    });

}