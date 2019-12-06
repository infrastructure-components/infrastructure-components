declare var __SERVICEORIENTED_ID__: any;
declare var __DATALAYER_ID__: any;
declare var __ISOFFLINE__: any;

// this must be imported to allow async-functions within an AWS lambda environment
// see: https://github.com/babel/babel/issues/5085
import "@babel/polyfill";

import React, { ReactNode } from "react";
import ReactDOMServer from "react-dom/server";
import express from "express";
import serverless from "serverless-http";



import Types from '../types';
import { extractObject, INFRASTRUCTURE_MODES, loadConfigurationFromModule } from '../libs/loader';

// DataLayer imports....
import ConnectSequence from 'connect-sequence';
import { graphql }  from 'graphql';
import {serviceAttachDataLayer} from "./attach-data-layer";

//import { getClientFilename } from '../libs/server-libs';
//import {loadIsoConfigFromComponent, applyCustomComponents} from "../isolib";
//import { applyAppClientModules } from '../types/client-app-config';

const createServer = (serviceOrientedId, isOffline) => {

    // express is the web-framework that lets us configure the endpoints
    const app = express();


    // in production, API-Gateway proxy redirects the request to S3
    // serve static files - the async components of the server - only used of localhost
    //app.use('/'+assetsDir, express.static(resolvedAssetsPath));


    // load the IsomorphicComponent
    // we must load it directly from the module here, to enable the aliad of the config_file_path
    const soaConfig = loadConfigurationFromModule(require('__CONFIG_FILE_PATH__'), INFRASTRUCTURE_MODES.RUNTIME);


    // let's extract it from the root configuration
    const soaApp = extractObject(
        soaConfig,
        Types.INFRASTRUCTURE_TYPE_CONFIGURATION,
        serviceOrientedId
    );
    
    

    // let's extract it from the root configuration
    const dataLayer = extractObject(
        soaConfig,
        Types.INFRASTRUCTURE_TYPE_COMPONENT,
        __DATALAYER_ID__
    );

    if (dataLayer) {

        //console.log ("Datalayer Active: ", dataLayer.id)

        //console.log ("isOffline: ", isOffline);

        if (isOffline) {
            console.log("setOffline!")
            dataLayer.setOffline(true);


        } else {

            const cors = require('cors');

            const corsOptions = {
                origin(origin, callback) {
                    callback(null, true);
                },
                credentials: true
            };
            app.use(cors(corsOptions));

            // TODO only allow the domains of the app (S3, APIs)
            var allowCrossDomain = function(req, res, next) {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
                //res.header('Access-Control-Allow-Headers', 'Content-Type,token');
                next();
            }
            app.use(allowCrossDomain);

        }

        app.use('/query', async (req, res, next) => {
            //console.log("request: ", req);

            const parseBody = (body) => {
                try {
                    return JSON.parse(body);
                } catch (e) {
                    console.log("cannot parse body: ", body.toString());


                    return body.toJSON();
                }
            }


            const parsedBody = parseBody(req.body);
            //console.log("parsedBody: ", parsedBody);

            if (!parsedBody.query) {
                res.status(500).set({
                    "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
                    //"Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
                }).send(JSON.stringify(req))
            }

            //console.log("now starting qgl-query/mutation")
            await graphql(dataLayer.getSchema(false), parsedBody.query).then(
                result_type => {
                    //console.log("result_type: ", result_type);
                    const entryQueryName = Object.keys(result_type.data)[0];

                    // when the query resolves, we get back
                    //console.log("pre-resolve | found entry: ", entryQueryName)

                    new ConnectSequence(req, res, next)
                        .append(...dataLayer.entries.filter(entry => entry.providesQuery(entryQueryName)).map(entry=> entry.middleware.callback))
                        .append(async (req, res, next) => {

                            //console.log("DL-mw: req: ");
                            //const parsedBody = JSON.parse(req.body);
                            //console.log("parsedBody: ", parsedBody);

                            // now we let the schema resolve with data
                            await graphql(dataLayer.getSchema(true), parsedBody.query).then(
                                result => res.status(200).set({
                                    "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
                                    // both does not work together?! see: https://stackoverflow.com/questions/19743396/cors-cannot-use-wildcard-in-access-control-allow-origin-when-credentials-flag-i
                                    //"Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
                                }).send(JSON.stringify(result)),
                                err => res.set({
                                    "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
                                    //"Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
                                }).status(500).send(err)
                            );
                        })
                        .run();
                },
                err => res.set({
                    "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
                    //"Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
                }).status(500).send(err)
            );

        });


    };

    // flattens the callbacks
    const unpackMiddlewares = (middlewares) => {
        // always returns the list of callbacks
        const cbList = (mw) => Array.isArray(mw.callback) ? mw.callback : [mw.callback];
        return middlewares.reduce((res,mw) => res.concat(...cbList(mw)), dataLayer ? [
            // when we have a dataLayer, let's attach it to the request
            serviceAttachDataLayer(dataLayer)
        ] : [])
    };


    // split the clientApps here and define a function for each of the clientApps, with the right middleware
    soaApp.services.map(service => {

        //console.log("found service: ", service);

        if (service.method.toUpperCase() == "GET") {
            app.get(service.path, ...unpackMiddlewares(service.middlewares));

        } else if (service.method.toUpperCase() == "POST") {
            app.post(service.path, ...unpackMiddlewares(service.middlewares));

        } else if (service.method.toUpperCase() == "PUT") {
            app.put(service.path, ...unpackMiddlewares(service.middlewares));

        } else if (service.method.toUpperCase() == "DELETE") {
            app.delete(service.path, ...unpackMiddlewares(service.middlewares));

        }

        return service;
    });

    return app;
};



// these variables are replaced during compilation
export default serverless(createServer(__SERVICEORIENTED_ID__, __ISOFFLINE__));