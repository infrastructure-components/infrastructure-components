declare var __ASSETS_PATH__: any;
declare var __RESOLVED_ASSETS_PATH__: any;
declare var __ISOMORPHIC_ID__: any;
declare var __DATALAYER_ID__: any;
declare var __ISOFFLINE__: any;

// this must be imported to allow async-functions within an AWS lambda environment
// see: https://github.com/babel/babel/issues/5085
import "@babel/polyfill";

import React, { ReactNode} from "react";
import ReactDOMServer from "react-dom/server";
import express from "express";
import serverless from "serverless-http";
import ConnectSequence from 'connect-sequence';

// make the styled-components work with server-side rendering
import { ServerStyleSheet } from 'styled-components'; // <-- importing ServerStyleSheet
import { matchPath } from 'react-router';
import helmet from 'react-helmet';
import {createServerApp} from "./routed-app";
import {getBasename} from '../libs/iso-libs';
import {serviceAttachDataLayer} from "./attach-data-layer";
import { serviceAttachStorage } from '../components/attach-storage';
import { listFiles } from '../storage/storage-libs';
import { findComponentRecursively } from '../libs';
import {isStorage} from "../storage/storage-component";
import { serviceAttachService } from '../components/attach-service';
import { callService } from './service-libs';

import Types from '../types';
import { extractObject, INFRASTRUCTURE_MODES, loadConfigurationFromModule } from '../libs/loader';
import { connectWithDataLayer } from './datalayer-integration';

import {
    graphql,
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLNonNull
}  from 'graphql';

import { getClientFilename } from '../libs/server-libs';

//import {loadIsoConfigFromComponent, applyCustomComponents} from "../isolib";
//import { applyAppClientModules } from '../types/client-app-config';

const createServer = (assetsDir, resolvedAssetsPath, isomorphicId, isOffline) => {


    // express is the web-framework that lets us configure the endpoints
    const app = express();

    // in production, API-Gateway proxy redirects the request to S3
    // serve static files - the async components of the server - only used of localhost
    app.use('/'+assetsDir, express.static(resolvedAssetsPath));

    
    // load the IsomorphicComponent
    // we must load it directly from the module here, to enable the aliad of the config_file_path
    const isoConfig = loadConfigurationFromModule(require('__CONFIG_FILE_PATH__'), INFRASTRUCTURE_MODES.RUNTIME);


    // let's extract it from the root configuration
    const isoApp = extractObject(
        isoConfig,
        Types.INFRASTRUCTURE_TYPE_CONFIGURATION,
        isomorphicId
    )
    // connect the middlewares
    isoApp.middlewares.map(mw => app.use(mw.callback));


    // let's extract it from the root configuration
    const dataLayer = extractObject(
        isoConfig,
        Types.INFRASTRUCTURE_TYPE_COMPONENT,
        __DATALAYER_ID__
    );

    if (dataLayer) {

        //console.log ("Datalayer Active: ", dataLayer.id)

        if (isOffline) {
            //console.log("setOffline!")
            dataLayer.setOffline(true);


        } else {
            //console.log("NOT offline!")

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
            //console.log("query-endpoint / offline: ", isOffline);
            const parsedBody = JSON.parse(req.body);
            //console.log(parsedBody)
            
            await graphql(dataLayer.getSchema(false), parsedBody.query).then(
                result_type => {
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
                                    "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
                                }).send(JSON.stringify(result)),
                                err => res.set({
                                    "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
                                    "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
                                }).status(500).send(err)
                            );
                        })
                        .run();
                },
                err => res.set({
                    "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
                    "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
                }).status(500).send(err)
            );
        });

    };

    // let's extract it from the root configuration
    const storages = findComponentRecursively(isoConfig,  c => isStorage(c));

    const reqListFiles = (
        storageId: string,
        prefix: string,
        listMode: string,
        data: any,
        onComplete: (data: any) => void,
        onError: (err: string) => void
    ) => {

        //console.log("listFiles function: ", storageId);
        //console.log("found storages: ", storages);

        const storage = storages.find(storage => storage.id == storageId);
        if (storage) {
            listFiles(storageId, prefix, listMode, data, onComplete, onError, storage, isOffline);
        } else {
            onError("could not find storage with id "+ storageId);
        }
    };

    const reqCallService = (
        id: string,
        args: any,
        onResult: (result: any) => void,
        onError: (error: any) => void,
        config: any,
        isOffline: Boolean = false
    ) => callService(id, args,onResult,onError,isoConfig,isOffline);


    // flattens the callbacks
    const unpackMiddlewares = (middlewares) => {
        // always returns the list of callbacks
        const cbList = (mw) => Array.isArray(mw.callback) ? mw.callback : [mw.callback];
        return middlewares.reduce(
            (res,mw) => res.concat(...cbList(mw)),
            // attach the callService-function
            [serviceAttachService(reqCallService)].concat(
                // when we have a dataLayer, let's attach it to the request
                dataLayer ? [serviceAttachDataLayer(dataLayer)] : [],

                //when we have a storage, attach the listFiles-function
                storages ? [ serviceAttachStorage(reqListFiles)] : []
            )
        );
    };


    // split the clientApps here and define a function for each of the clientApps, with the right middleware
    isoApp.services.map(service => {



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

    //console.log("webApps: ",isoApp.webApps.length, " -> ", isoApp.webApps);

    // split the clientApps here and define a function for each of the clientApps, with the right middleware
    isoApp.webApps
        //.filter(clientApp => clientApp.middlewares !== undefined)
        .map(clientApp => {

            const serveMiddleware = (req, res, next) => serve(req, res, next, clientApp, assetsDir, isoConfig, isOffline);
            const routes = clientApp.routes.filter(route => route.middlewares !== undefined && route.middlewares.length > 0);

            if (clientApp.method.toUpperCase() == "GET") {

                app.get(clientApp.path, ...unpackMiddlewares(clientApp.middlewares));
                routes.forEach(route => app.get(route.path, ...unpackMiddlewares(route.middlewares)));
                app.get(clientApp.path, serveMiddleware);

            } else if (clientApp.method.toUpperCase() == "POST") {

                app.post(clientApp.path, ...unpackMiddlewares(clientApp.middlewares));
                routes.forEach(route => app.post(route.path,  ...unpackMiddlewares(route.middlewares)));
                app.post(clientApp.path, serveMiddleware);

            } else if (clientApp.method.toUpperCase() == "PUT") {

                app.put(clientApp.path, ...unpackMiddlewares(clientApp.middlewares));
                routes.forEach(route => app.put(route.path,  ...unpackMiddlewares(route.middlewares)));
                app.put(clientApp.path, serveMiddleware);

            } else if (clientApp.method.toUpperCase() == "DELETE") {

                app.delete(clientApp.path, ...unpackMiddlewares(clientApp.middlewares));
                routes.forEach(route => app.delete(route.path,  ...unpackMiddlewares(route.middlewares)));
                app.delete(clientApp.path, serveMiddleware);

            }

            return clientApp;
        });


    return app;
};


async function serve (req, res, next, clientApp, assetsDir, isoConfig, isOffline) {

    //console.log("serve - isOffline: ", isOffline)

    //TODO use try catch depending on the environment
    //try {


    //context is used by react router, empty by default
    let context: any = {};


    const basename = getBasename();

    // creating the stylesheet
    const sheet = new ServerStyleSheet();

    const parsedUrl = req.url.indexOf("?") >= 0 ? req.url.substring(0, req.url.indexOf("?")) : req.url;
    //console.log("parsedUrl: ", parsedUrl);


    ////////// TODO refactor
    var foundPath = undefined;



    // match request url to our React Router paths and grab the path-params
    let matchResult = clientApp.routes.find(
        ({ path, exact }) => {
            //console.log("match path: ", new RegExp(path))

            foundPath = matchPath(parsedUrl,
                {
                    path: new RegExp(path),
                    exact: exact,
                    strict: false
                }
            );
            //console.log("foundPath: ", foundPath)
            return foundPath
        }) || {};
    let { path } = matchResult;

    //console.log("found: ", foundPath);
    //console.log("server: path params: ", foundPath ? foundPath.params : "---");
    //console.log("url: ", req.url);

    const routePath = foundPath ? (
        (typeof foundPath.path === 'string' || foundPath.path instanceof String) ? (
            foundPath.path.indexOf("/:") > 0 ?
                foundPath.path.substring(0, foundPath.path.indexOf("/:")) :
                foundPath.path
        ) : req.url

    ) : "";

    //console.log("routePath: ", routePath);
    ////////// END OF REFACTORING required



    //console.log("app data layer id: ", clientApp.dataLayerId);

    const serverState = {};
    const setServerValue = (id, value, isInitial=false) => {
        if (!serverState[id] || !isInitial) {
            serverState[id] = value;
            //console.log("set >>", id, "<< -> ", value);
        }


    }

    const getIsomorphicState = () => {
        //console.log("serverState: ", serverState);
        return `window.__ISOMORPHICSTATE__ = ${JSON.stringify(serverState)}`
    };

    const fConnectWithDataLayer = clientApp.dataLayerId !== undefined ?
        connectWithDataLayer(clientApp.dataLayerId, req, isOffline) :
        async function (app) {
            //console.log("default dummy data layer")
            return {connectedApp: app, getState: () => ""};
        };

    /*const serverApp = await new Promise((resolve, reject) => {

    });*/

    var renderList = [];
    const addToRenderList = (fRenderSsr, hashValue) => {
        //console.log("add to Render: ", hashValue);
        renderList = renderList.concat([{fRenderSsr: fRenderSsr, hashValue: hashValue}]);
    };

    const completeSSR = (htmlData, getState, renderListResults) => {

        // getting all the tags from the sheet
        const styles = sheet.getStyleTags();

        //render helmet data aka meta data in <head></head>
        const helmetData = helmet.renderStatic();

        const fRender = clientApp.renderHtmlPage ? clientApp.renderHtmlPage : renderHtmlPage;

        // render a page with the state and return it in the response
        res.status(200).send(
            fRender(htmlData, styles, getState(), getIsomorphicState(), `window.__RENDERLISTSTATE__ = ${JSON.stringify(renderListResults)}`, helmetData, basename, req.url, clientApp, assetsDir)
        ).end();
    };

    async function renderApp (apolloState, oldServerState, oldStorageState, htmlData, getApolloState, newStorageState) {

        const tempApolloState = getApolloState();
        const tempServerState = Object.assign({}, serverState);

        /*console.log("APOLLO STATE BEFORE", apolloState, "\nAPOLLO STATE AFTER ", tempApolloState);
        console.log("SERVER STATE BEFORE", oldServerState, "\nSERVER STATE AFTER ", serverState);
        console.log("STORAGE STATE BEFORE", oldStorageState, "\nSTORAGE STATE AFTER ", newStorageState);
        */

        if (JSON.stringify(apolloState) !== JSON.stringify(tempApolloState) ||
            JSON.stringify(oldServerState) !== JSON.stringify(serverState) ||
            (oldStorageState && oldStorageState.length !== newStorageState.length)
        ) {
            //console.log("--------- need to render --------");

            // create the app and connect it with the DataAbstractionLayer
            await fConnectWithDataLayer(
                createServerApp(
                    clientApp.routes,
                    clientApp.redirects,
                    basename,
                    req.url,
                    context,
                    req,
                    res,
                    require('infrastructure-components').getAuthCallback(isoConfig, clientApp.authenticationId),
                    setServerValue,
                    addToRenderList,
                    isoConfig,
                    isOffline,
                    newStorageState,
                    serverState
                )
            ).then(async ({connectedApp, getState}) => {

                //console.log("renderList before: ", renderList)
                // collect the styles from the connected appsheet.collectStyles(
                const newHtmlData = ReactDOMServer.renderToString(connectedApp);

                const addToStorage = await Promise.all(
                    renderList.filter((item, index, arr)=> {
                        const c = arr.map(item=> item.hashValue);
                        return  index === c.indexOf(item.hashValue)
                    }).map(({fRenderSsr, hashValue}) => new Promise((resolve, reject) => {
                        return fRenderSsr(
                            ({data, files})=>{
                                //console.log("resolved: ", files);
                                resolve({
                                    hashValue: hashValue,
                                    data: data,
                                    files: files,
                                })
                            }, err=>{
                                //console.log("rejected: ", err);
                                reject(err);
                            }
                        )
                    }))
                );

                //console.log("renderList after: ", renderList)
                renderList.length = 0;

                //console.log("addToStorage: ", addToStorage);

                //completeSSR(newHtmlData, getState, storageState);
                await renderApp (tempApolloState, tempServerState, newStorageState,
                    newHtmlData, getState, newStorageState.concat(addToStorage));
            });

        } else {
            //console.log("----- no difference, return ------");
            completeSSR(htmlData, getApolloState, newStorageState);
        };
    };

    await renderApp ({}, serverState, undefined, "", ()=> "", []);

    /*
    // create the app and connect it with the DataAbstractionLayer
    await fConnectWithDataLayer(
        createServerApp(
            clientApp.routes,
            clientApp.redirects,
            basename,
            req.url,
            context,
            req,
            require('infrastructure-components').getAuthCallback(isoConfig, clientApp.authenticationId),
            setServerValue,
            addToRenderList,
            isoConfig,
            isOffline,
            undefined,
            undefined
        )
    ).then(async ({connectedApp, getState}) => {

        //console.log("resolved... renderList: ", renderList);

        // collect the styles from the connected appsheet.collectStyles(
        const htmlData = ReactDOMServer.renderToString(connectedApp);
        //console.log(htmlData);

        const renderListResults = await Promise.all(
            renderList.filter((item, index, arr)=> {
                const c = arr.map(item=> item.hashValue);
                return  index === c.indexOf(item.hashValue)
            }).map(({fRenderSsr, hashValue}) => new Promise((resolve, reject) => {
                return fRenderSsr(
                    (data, files)=>{
                        //console.log("resolved: ", files);
                        resolve({
                            hashValue: hashValue,
                            data: data,
                            files: files,
                        })
                    }, err=>{
                        //console.log("rejected: ", err);
                        reject(err);
                    }
                )
            }))
        );


        if (renderListResults && renderListResults.length > 0) {
            //console.log("need to rerender! got renderListResults: ", renderListResults);

            await renderApp ({}, serverState, renderListResults, htmlData, getState);

        } else {
            completeSSR(htmlData, getState, renderListResults);
        }

    });*/

}


/**
 *
 * This functions puts together the whole Html
 *
 * - style as collected from the styled-components
 * - head-meta data: from helmet
 * - data state: from the DAL
 * - basename: to let the client know
 *
 * The html loads the script from the path where we find the assets. This is part of the config, thus load it
 * using `require('../config').pathToAssets(process.env.STAGE_PATH)`
 *
 * The script loading the app.bundle.js uses the window location in order to find out whether there is a slash
 *
 * //TODO the app.bundle.js depends on the name "app". Paramterize this!
 *
 * //TODO: apply the same base style as the client does
 *
 * when we are in a sub-route, e.g. when we have path parameters, we need to add ../ to the path to the assets
 *
 * Routing to the Assets
 *
 * entered url | basename==/ |  basename==/dev
 * ---------------------------------------------
 * (none)           /               /dev
 * /                /               /dev
 * (dev)/           /               /
 * (dev)/route      /               /
 * (dev)/route/     ../             ../
 * (dev)/route/:var ../             ../
 * TODO what happens with more than one path parameter?
 *
 *
 * @param host the host of the request
 * @param html
 * @param styles
 * @param preloadedState the state in form of a script
 * @param helmet
 */
function renderHtmlPage(html, styles, preloadedState, isomorphicState, renderListResults, helmet, basename, routePath, clientApp, assetsDir) {
    //<link rel="icon" href="/assets/favicon.ico" type="image/ico" />
    //console.log(preloadedState);
    const path = require('path');

    const calcBase = () => {
        return path.join(basename, routePath);
    }



    //For each"/" in the entered path after the basename, we need to add "../" to the assets-path
    //when there is a basename, it must be added

    //console.log("calcBase: ", calcBase());

    return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${helmet.title.toString()}
        ${helmet.meta.toString()}
        ${helmet.link.toString()}
        <meta name="viewport" content="width=device-width, initial-scale=1.0"> 
        ${styles}
        <style>
            html, body, #root {
                display: block;
                margin: 0px;
            }
         </style>
      </head>
      <body>
        <div id="root">${html.trim()}</div>
        <script>
          ${preloadedState}
          ${isomorphicState}
          ${renderListResults}
          window.__BASENAME__ = "${basename}";
        </script>
        <script>
            var loadscript = document.createElement('script');
            function getPath() {
                const basePath = ${basename !== "/" ? "window.location.pathname.startsWith(\""+basename+"\") ? \"\": \"/\" " : "\"\"" };
                const routePath= "${routePath !== "/" ? routePath : ""}";
                const pre = window.location.pathname.startsWith(basePath+routePath+"/") ? ".." : "";
                return pre+"${path.join(basename, assetsDir, getClientFilename(clientApp.id))}";
                
            }
            
            loadscript.setAttribute('src',getPath());
            document.body.appendChild(loadscript);            
        </script>
        
      </body>
    </html>`
}


// we're exporting the handler-function as default, must match the sls-config!
//export default (assetsDir, resolvedAssetsPath) => serverless(createServer(assetsDir, resolvedAssetsPath));

/*
const serverIndexPath = path.join(serverPath, "index.js");
fs.writeFileSync(serverIndexPath, `const lib = require ('./server');
const server = lib.default('${ssrConfig.assetsPath}', '${resolveAssetsPath(ssrConfig)}');
exports.default = server;*/

// these variables are replaced during compilation
export default serverless(createServer(__ASSETS_PATH__, __RESOLVED_ASSETS_PATH__, __ISOMORPHIC_ID__, __ISOFFLINE__));