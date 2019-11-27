import * as React from 'react';

import Types from '../types';
import { IComponent } from "../types/component";
import { IInfrastructure } from "../types";
import middleware, {isMiddleware} from "../middleware/middleware-component";
import {getChildrenArray} from "../index";

export const STORAGE_INSTANCE_TYPE = "StorageComponent";


/**
 * Arguments provided by the user
 */
export interface IStorageArgs {
    /**
     * a unique id or name of the webapp
     */
    id: string,

    /**
     * the relative  path of the route, e.g. "/" for the root, or "/something", or "*" for any
     * Can be a regex to filter the paths of the routes and redirects
     */
    path: string

}

/**
 * properties added programmatically
 */
export interface IStorageProps {

    /**
     * A Webapp component supports middlewares, defines as direct children
     */
    middlewares: Array<any>,


    /**
     * A function that the DataLayer provides, it lets the WebApp get the DataLayer Id
     */
    setDataLayerId: (dataLayerId: string) => void,

    /**
     * The id of the datalayer - if the webapp applies to one.
     * filled by the DataLayer
     */
    dataLayerId?: any,

    /**
     * The http method of the route, e.g. get, post, ...
     */
    method: string,

}


/**
 * identifies a component as a DataLayer
 *
 * @param component to be tested
 */
export function isStorage(component) {
    return component !== undefined &&
        component.instanceType === STORAGE_INSTANCE_TYPE
}



export default (props: IStorageArgs | any) => {

    const componentProps: IInfrastructure & IComponent = {
        infrastructureType: Types.INFRASTRUCTURE_TYPE_COMPONENT,
        instanceType: STORAGE_INSTANCE_TYPE,
        instanceId: props.id,

        insulatesChildComponent: (child) => {
            // a webapp insulates (handles itself) middlewares and routes and does not privide to higher levels
            return isMiddleware(child)
        }
    };

    const storageProps: IStorageProps = {
        middlewares: getChildrenArray(props.children)
            .filter(child => isMiddleware(child))
            .concat([middleware({
                callback: async function (req, res, next) {

                    const parsedBody = JSON.parse(req.body);

                    console.log("this is the storage-service: ", parsedBody.part, " of ", parsedBody.total_parts);

                    const bucket = process.env.BUCKET_ID;
                    const isOffline = !(bucket.startsWith("infrcomp"));

                    // prepare file data
                    //const matches = parsedBody.file_data.match(/^data:.+\/(.+);base64,(.*)$/);
                    //const ext = matches[1];
                    //const base64_data = matches[2];
                    const buffer = Buffer.from(parsedBody.file_data.match(/^data:.+\/(.+);base64,(.*)$/)[2], 'base64');


                    const path = require ("path");
                    const fs = require("fs");
                    const AWS = require('aws-sdk');

                    //AWS.config.update({region: 'eu-west-1'});
                    const s3 = new AWS.S3(Object.assign({
                            apiVersion: '2006-03-01'
                        },
                        isOffline ? {
                            s3ForcePathStyle: true,
                            accessKeyId: 'S3RVER', // This specific key is required when working offline
                            secretAccessKey: 'S3RVER',
                            endpoint: new AWS.Endpoint('http://localhost:3002'),
                        } : {}
                    ));



                    const getTempName = isOffline ? () => {

                        const targetFolder = ".s3";
                        //check if folder needs to be created or integrated
                        if ( !fs.existsSync( targetFolder ) ) {
                            fs.mkdirSync( targetFolder, {recursive: true} );

                        }
                        fs.chmodSync( targetFolder, 0o777);

                        return path.join(targetFolder,parsedBody.file);
                    } : () => "/tmp/"+parsedBody.file;

                    const tmpName = getTempName();


                    await new Promise((resolve, reject) => {
                        fs.writeFile(tmpName, buffer,
                            (err) => {
                                if (err) {
                                    console.log(err);
                                    reject(err);
                                } else {
                                    console.log("Successfully Written File to tmp.");
                                    resolve();
                                }

                            });
                    });

                    const getFilePartKey = (idx) => parsedBody.file + "_ICPART_" + idx;

                    await s3.upload({
                        Bucket: bucket,
                        Key: getFilePartKey(parsedBody.part),
                        Body: fs.createReadStream(tmpName),
                        //Expires:expiryDate
                    }).promise().then(
                        function (data) {
                            //console.log("file uploaded: ", data);
                        },
                        function (error) {
                            console.log("could not upload to s3 ", error);
                        }
                    );

                    if (parseInt(parsedBody.part) + 1 == parseInt(parsedBody.total_parts)) {

                        const parts = Buffer.concat(await Promise.all(Array.apply(null, Array(parseInt(parsedBody.total_parts))).map(
                            function (part, idx) {
                                return new Promise((resolve, reject) => {
                                    const partParams = {
                                        Bucket: bucket,
                                        Key: getFilePartKey(idx)
                                    };

                                    return s3.getObject(partParams).promise().then(
                                        async function (data) {
                                            //console.log("file downloaded: ", data);

                                            await s3.deleteObject(partParams).promise().then(
                                                ok => ok,
                                                err => {
                                                    console.log("could not delete part ", idx, err);
                                                }
                                            );

                                            resolve(Buffer.from(data.Body, 'base64'));

                                        },
                                        function (error) {
                                            console.log("could not load part ", idx, error);
                                            reject(error);
                                        }
                                    );

                                });

                            }
                        )));

                        //console.log(parts);

                        const finalparams = {
                            Bucket: bucket,
                            Key: parsedBody.file,
                            Body: parts,
                            //Expires:expiryDate
                        };

                        await s3.upload(finalparams).promise().then(
                            function (data) {
                                //console.log("file uploaded: ", data);

                                res.status(200)
                                    .set({
                                        "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
                                        "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
                                    })
                                    .send(JSON.stringify({uri: data.Location }));

                                return;

                            },
                            function (error) {
                                console.log("could not upload to s3 ", error);

                                res.status(500).set({
                                    "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
                                    "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
                                }).send("error");

                                return
                            }
                        );

                    } else {
                        res.status(200).set({
                            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
                            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
                        }).send(JSON.stringify({part: parsedBody.part, total_parts: parsedBody.total_parts }));
                    }


                }
            })]),

        setDataLayerId: (dataLayerId: string) => {
            props.dataLayerId = dataLayerId;
        },

        method: "POST"
    }

    return Object.assign(props, componentProps, storageProps);


};