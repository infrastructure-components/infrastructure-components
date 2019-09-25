import {getBasename} from "../libs/iso-libs";
declare var __ISOMORPHIC_ID__: any;
declare var __DATALAYER_ID__: any;

/**
 * The global declaration is required of the typedoc documentation
 */
declare global {
    interface Window {
        __BASENAME__: any;
        __ISOMORPHICSTATE__: any;
    }
}

// this must be imported to allow async-functions within an AWS lambda environment
// see: https://github.com/babel/babel/issues/5085
import "@babel/polyfill";

import React from 'react';
import { hydrate } from 'react-dom';
import { createClientApp } from './routed-app';
import Types from '../types';
import { extractObject, INFRASTRUCTURE_MODES, loadConfigurationFromModule } from '../libs/loader';
import { hydrateFromDataLayer } from './datalayer-integration';

/**
 *
 * this module must not import anything that does not exist in web-mode, e.g. fs
 *
 * Creates the main Client WebApp. The `./src/client/index.tsx` module exports the result of calling this function
 * This serves as Entry-Point specified in the [[webpackConfigClient]]
 *
 * This function takes the data that is generated from the server endpoint
 */
const createClientWebApp = () => {

    var basename: string = getBasename(); /*
    if (typeof window != 'undefined' && window.__BASENAME__) {
        basename = window.__BASENAME__;

        // we do not delete the basename here, because we may need it at different places
        //delete window.__BASENAME__;
    }*/

    // load the IsomorphicComponent
    // we must load it directly from the module here, to enable the aliad of the config_file_path
    const isoConfig = loadConfigurationFromModule(require('__CONFIG_FILE_PATH__'), INFRASTRUCTURE_MODES.RUNTIME);

    // let's extract it from the root configuration
    const webApp = extractObject(
        isoConfig,
        Types.INFRASTRUCTURE_TYPE_CLIENT,
        __ISOMORPHIC_ID__
    );

    

    /*
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

    //console.log("found: ", foundPath);
    console.log("server: path params: ", foundPath ? foundPath.params : "---");*/


    const preloadedState = typeof window != 'undefined' && window.__ISOMORPHICSTATE__ ? window.__ISOMORPHICSTATE__ : undefined;

    // when we have a datalayer, we can hydrate the state!
    const fHydrate = webApp.dataLayerId !== undefined ? (node) => hydrateFromDataLayer(
        node,
        extractObject(
            isoConfig,
            Types.INFRASTRUCTURE_TYPE_COMPONENT,
            webApp.dataLayerId
        )
    ) : (node) => {
        //console.log("this is the dummy data layer hydration");
        return node;
    };

    hydrate(
        fHydrate(
            createClientApp(
                webApp.routes,
                webApp.redirects,
                basename,
                webApp.listenOnBrowserHistory,
                require('infrastructure-components').getAuthCallback(isoConfig, webApp.authenticationId),
                preloadedState
            )
        ),
        document.getElementById('root')
    );


};

// this module MUST NOT export anything else. Because it would also load the default, which would be executed right away
export default createClientWebApp();