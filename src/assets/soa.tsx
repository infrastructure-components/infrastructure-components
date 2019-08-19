declare var __ISOMORPHIC_ID__: any;

import React from 'react';
import ReactDOM from 'react-dom';
import { extractObject, INFRASTRUCTURE_MODES, loadConfigurationFromModule } from '../libs/loader';

import { createSinglePageApp } from './routed-app';
import Types from '../types';
import { renderFromDataLayer } from './datalayer-integration';

/**
 * this module must not import anything that does not exist in web-mode, e.g. fs
 */
const createApp = () => {

    // load the IsomorphicComponent
    // we must load it directly from the module here, to enable the aliad of the config_file_path
    const soaConfig = loadConfigurationFromModule(require('__CONFIG_FILE_PATH__'), INFRASTRUCTURE_MODES.RUNTIME);

    // function to create the client-side app with
    const fCreateApp = soaConfig.dataLayerId !== undefined ? (node) => renderFromDataLayer(
        node,
        extractObject(
            soaConfig,
            Types.INFRASTRUCTURE_TYPE_COMPONENT,
            soaConfig.dataLayerId
        )
    ) : (node) => {
        console.log("no data layer present");
        return node;
    };

    ReactDOM.render(
        fCreateApp(
            createSinglePageApp(
                soaConfig.routes,
                soaConfig.redirects
            )
        ),
        document.getElementById('root')
    );

};

// this module MUST NOT export anything else. Because it would also load the default, which would be executed right away
export default createApp();