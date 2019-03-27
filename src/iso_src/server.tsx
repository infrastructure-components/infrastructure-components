// this must be imported to allow async-functions within an AWS lambda environment
// see: https://github.com/babel/babel/issues/5085
import "@babel/polyfill";

import React, { ReactNode} from "react";
import ReactDOMServer from "react-dom/server";
import express from "express";
import serverless from "serverless-http";

// make the styled-components work with server-side rendering
import { ServerStyleSheet } from 'styled-components'; // <-- importing ServerStyleSheet
import { matchPath } from 'react-router';
import helmet from 'react-helmet';
import {createServerApp} from "./routed-app";

import { getClientFilename } from '../types/app-config';
import {loadIsoConfigFromComponent, applyCustomComponents} from "../isolib";
//import { applyAppClientModules } from '../types/client-app-config';

const createServer = (assetsDir, resolvedAssetsPath) => {

    // express is the web-framework that lets us configure the endpoints
    const app = express();


    // in production, API-Gateway proxy redirects the request to S3
    // serve static files - the async components of the server - only used of localhost
    app.use('/'+assetsDir, express.static(resolvedAssetsPath));

    // connect the middlewares
    var IsoConfig = require('IsoConfig');
    if (IsoConfig && IsoConfig.default && IsoConfig.default.props) {
        console.log("found component!");
        IsoConfig = loadIsoConfigFromComponent(IsoConfig.default, false);
    }


    IsoConfig.isoConfig.middlewares.map(mw => app.use(mw));



    // split the clientApps here and define a function for each of the clientApps, with the right middleware
    IsoConfig.isoConfig.clientApps
        .filter(clientApp => clientApp.middlewareCallbacks !== undefined)
        .map(clientApp => {


            const serveMiddleware = (req, res, next) => serve(req, res, next, clientApp, assetsDir);

            if (clientApp.method.toUpperCase() == "GET") {

                app.get(clientApp.path, ...clientApp.middlewareCallbacks)
                applyRouteMw(clientApp, app);
                app.get(clientApp.path, serveMiddleware);

            } else if (clientApp.method.toUpperCase() == "POST") {

                app.post(clientApp.path, ...clientApp.middlewareCallbacks)
                applyRouteMw(clientApp, app);
                app.post(clientApp.path, serveMiddleware);

            } else if (clientApp.method.toUpperCase() == "PUT") {

                app.put(clientApp.path, ...clientApp.middlewareCallbacks)
                applyRouteMw(clientApp, app);
                app.put(clientApp.path, serveMiddleware);

            } else if (clientApp.method.toUpperCase() == "DELETE") {

                app.delete(clientApp.path, ...clientApp.middlewareCallbacks)
                applyRouteMw(clientApp, app);
                app.delete(clientApp.path, serveMiddleware);

            }

            return clientApp;
        });


    return app;
};

const applyRouteMw = (clientApp, app) => {
    clientApp.routes
        .filter(route => route.middlewareCallbacks !== undefined && route.middlewareCallbacks.length > 0)
        .map(route => {
            if (route.method.toUpperCase() == "GET") {
                app.get(route.path, ...route.middlewareCallbacks)
            } else if (route.method.toUpperCase() == "POST") {
                app.post(route.path, ...route.middlewareCallbacks)
            } else if (route.method.toUpperCase() == "PUT") {
                app.put(route.path, ...route.middlewareCallbacks)
            } else if (route.method.toUpperCase() == "DELETE") {
                app.delete(route.path, ...route.middlewareCallbacks)
            }

            return route;
        });

}

async function serve (req, res, next, clientApp, assetsDir) {

    //TODO use try catch depending on the environment
    //try {


    //context is used by react router, empty by default
    let context: any = {};


    const basename = getBasename();

    // creating the stylesheet
    const sheet = new ServerStyleSheet();


    const parsedUrl = req.url.indexOf("?") >= 0 ? req.url.substring(0, req.url.indexOf("?")) : req.url;
    console.log("parsedUrl: ", parsedUrl);


    ////////// TODO refactor
    var foundPath = undefined;


    // match request url to our React Router paths and grab the path-params
    let matchResult = clientApp.routes.find(
        ({ path, exact }) => {
            foundPath = matchPath(parsedUrl,
                {
                    path,
                    exact,
                    strict: false
                }
            )
            return foundPath
        }) || {};
    let { path } = matchResult;

    console.log("found: ", foundPath);
    console.log("params: ", foundPath ? foundPath.params : "---");

    const routePath = foundPath ? (
        foundPath.path.indexOf("/:") > 0 ?
            foundPath.path.substring(0, foundPath.path.indexOf("/:")) :
            foundPath.path
    ) : "";

    console.log("routePath: ", routePath);
    ////////// END OF REFACTORING required

    console.log("app data layer: ", clientApp.dataLayer);

    const connectWithDataLayer = clientApp.dataLayer !== undefined ?
        clientApp.dataLayer.type({infrastructureMode: "component"}).connectWithDataLayer :
        async function (app) {
            console.log("default dummy data layer")
            return {connectedApp: app, getState: () => ""};
        };

    // create the app and connect it with the DataAbstractionLayer
    await connectWithDataLayer(
        createServerApp(
            clientApp.routes,
            clientApp.redirects,
            basename,
            req.url,
            context, req)).then(({connectedApp, getState}) => {

        console.log("resolved...")

        // collect the styles from the connected app
        const htmlData = ReactDOMServer.renderToString(sheet.collectStyles(connectedApp));

        // getting all the tags from the sheet
        const styles = sheet.getStyleTags();

        //render helmet data aka meta data in <head></head>
        const helmetData = helmet.renderStatic();

        // render a page with the state and return it in the response
        res.status(200).send(
            renderHtmlPage(htmlData, styles, getState(), helmetData, basename, routePath, clientApp, assetsDir)
        ).end();
    });


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
function renderHtmlPage(html, styles, preloadedState, helmet, basename, routePath, clientApp, assetsDir) {
    //<link rel="icon" href="/assets/favicon.ico" type="image/ico" />
    console.log(preloadedState);
    const path = require('path');

    const calcBase = () => {
        return path.join(basename, routePath);
    }



    //For each"/" in the entered path after the basename, we need to add "../" to the assets-path
    //when there is a basename, it must be added

    console.log("calcBase: ", calcBase());

    return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${helmet.title.toString()}
        ${helmet.meta.toString()}
        ${helmet.link.toString()}
        ${styles}
        <style>
            body {
                display: block;
                margin: 0px;
            }
         </style>
      </head>
      <body>
        <div id="root">${html.trim()}</div>
        <script>
          ${preloadedState}
          window.__BASENAME__ = "${basename}";
        </script>
        <script>
            var loadscript = document.createElement('script');
            function getPath() {
                console.log( window.location.pathname);
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

const getBasename = () => {
    return process.env.STAGE_PATH !== undefined && process.env.STAGE_PATH !== "undefined" ?
        "/"+process.env.STAGE_PATH : "/";
};

// we're exporting the handler-function as default, must match the sls-config!
export default (assetsDir, resolvedAssetsPath) => serverless(createServer(assetsDir, resolvedAssetsPath));