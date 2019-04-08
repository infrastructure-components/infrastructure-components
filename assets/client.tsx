/**
 * The global declaration is required of the typedoc documentation
 */
declare global {
    interface Window {
        __BASENAME__: any;
    }
}

// this must be imported to allow async-functions within an AWS lambda environment
// see: https://github.com/babel/babel/issues/5085
import "@babel/polyfill";

import React from 'react';
import { hydrate } from 'react-dom';
import { createClientApp } from './routed-app';
import Types from '../src/types';
import { extractObject, INFRASTRUCTURE_MODES, loadConfigurationFromModule } from '../src/libs/loader';


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

    var basename: string = "";
    if (typeof window != 'undefined' && window.__BASENAME__) {
        basename = window.__BASENAME__;
        delete window.__BASENAME__;
    }

    // load the IsomorphicComponent
    // we must load it directly from the module here, to enable the aliad of the config_file_path
    const isoConfig = loadConfigurationFromModule(require('__CONFIG_FILE_PATH__'), INFRASTRUCTURE_MODES.RUNTIME);

    // let's extract it from the root configuration
    const webApp = extractObject(
        isoConfig,
        Types.INFRASTRUCTURE_TYPE_CLIENT,
        __ISOMORPHIC_ID__
    )


    // TODO!!!!
    //const clientApp = IsoConfig.isoConfig.clientApps["INDEX_OF_CLIENT"];

    /*const hydrateFromDataLayer = clientApp.dataLayer !== undefined ?
        clientApp.dataLayer.type({infrastructureMode: "component"}).hydrateFromDataLayer :
        (node) => {
            console.log("this is the dummy data layer hydration")
            return node;
        }*/

    hydrate(//hydrateFromDataLayer(
        createClientApp(
            webApp.routes,
            webApp.redirects,
            basename),//),
        document.getElementById('root')
    );


};

// this module MUST NOT export anything else. Because it would also load the default, which would be executed right away
export default createClientWebApp();