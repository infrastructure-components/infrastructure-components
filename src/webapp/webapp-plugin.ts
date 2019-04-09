/**
 * This module must not import anything globally not workin in web-mode! if needed, require it within the functions
 */
import { IConfigParseResult } from '../libs/config-parse-result';
import { IPlugin } from '../libs/plugin';
import { isWebApp } from './webapp-component'

/**
 * Parameters that apply to the whole Plugin, passed by other plugins
 */
export interface IWebAppPlugin {

    /**
     * path to a directory where we put the final bundles
     */
    buildPath: string,

    /**
     * path to the main config file
     */
    configFilePath: string
}

/**
 * A Plugin to detect WebApp-Components
 * @param props
 */
export const WebAppPlugin = (props: IWebAppPlugin): IPlugin => {
    const path = require('path');

    const result: IPlugin = {
        // identify Isomorphic-App-Components
        applies: (component): boolean => {

            return isWebApp(component);
        },

        // convert the component into configuration parts
        // while the component is of Type `any`, its props must be of type `IWebApp`
        process: (component: any, childConfigs: Array<IConfigParseResult>, infrastructureMode: string | undefined): IConfigParseResult => {

            return {
                slsConfigs: [],

                // a webapp has its own webpack configuration
                webpackConfigs: [
                    require("../../../infrastructure-scripts/dist/infra-comp-utils/webpack-libs").complementWebpackConfig(require("../../../infrastructure-scripts/dist/infra-comp-utils/webpack-libs").createClientWebpackConfig(
                        "./"+path.join("node_modules", "infrastructure-components", "dist" , "assets", "client.js"), //entryPath: string,
                        path.join(require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").currentAbsolutePath(), props.buildPath), //use the buildpath from the parent plugin
                        component.id,
                        {
                            __CONFIG_FILE_PATH__: require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").pathToConfigFile(props.configFilePath), // replace the IsoConfig-Placeholder with the real path to the main-config-bundle
                        }, {
                            __ISOMORPHIC_ID__: `"${component.instanceId}"`,
                        }
                    ))
                ],

                postBuilds: [],
            }
        }
    }

    return result;

};