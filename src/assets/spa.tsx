declare var __ISOMORPHIC_ID__: any;

import React from 'react';
import ReactDOM from 'react-dom';
import { INFRASTRUCTURE_MODES, loadConfigurationFromModule } from '../libs/loader';


/**
 * this module must not import anything that does not exist in web-mode, e.g. fs
 */
const createSinglePageApp = () => {

    // load the IsomorphicComponent
    // we must load it directly from the module here, to enable the aliad of the config_file_path
    const spaConfig = loadConfigurationFromModule(require('__CONFIG_FILE_PATH__'), INFRASTRUCTURE_MODES.RUNTIME);

    ReactDOM.render(spaConfig.render(), document.getElementById('root'));

};

// this module MUST NOT export anything else. Because it would also load the default, which would be executed right away
export default createSinglePageApp();