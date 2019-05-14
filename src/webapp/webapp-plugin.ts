/**
 * This module must not import anything globally not workin in web-mode! if needed, require it within the functions
 */
import { IConfigParseResult } from '../libs/config-parse-result';
import { IPlugin } from '../libs/plugin';
import { isWebApp } from './webapp-component'
import { PARSER_MODES } from '../libs/parser';

/**
 * Parameters that apply to the whole Plugin, passed by other plugins
 */
export interface IWebAppPlugin {

    /**
     * one of the [[PARSER_MODES]]
     */
    parserMode: string,

    /**
     * path to a directory where we put the final bundles
     */
    buildPath: string,

    /**
     * path to the main config file
     */
    configFilePath: string,

    /**
     * relative path to the assets folder
     */
    assetsPath: string
}

/**
 * A Plugin to detect WebApp-Components
 *
 * IMPORTANT: The WebAppPlugin provides as webPackConfigs a list of functions (to take further args!)
 * This must be considered when being forwarded!
 *
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
        process: (
            component: any,
            childConfigs: Array<IConfigParseResult>,
            infrastructureMode: string | undefined
        ): IConfigParseResult => {

            return {
                slsConfigs: [],

                // a webapp has its own webpack configuration
                webpackConfigs: [
                    (args) => {
                        //console.log("web-app-plugin args: ", args);
                        return require("../../../infrastructure-scripts/dist/infra-comp-utils/webpack-libs").complementWebpackConfig(
                            require("../../../infrastructure-scripts/dist/infra-comp-utils/webpack-libs").createClientWebpackConfig(
                                "./"+path.join("node_modules", "infrastructure-components", "dist" , "assets", "client.js"), //entryPath: string,
                                path.join(require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").currentAbsolutePath(), props.buildPath), //use the buildpath from the parent plugin
                                component.id, // appName
                                props.assetsPath, //assetsPath
                                args["stagePath"], // stagePath
                                {
                                    __CONFIG_FILE_PATH__: require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").pathToConfigFile(props.configFilePath), // replace the IsoConfig-Placeholder with the real path to the main-config-bundle

                                    // required of data-layer, makes the context match!
                                    "infrastructure-components": path.join(
                                        require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").currentAbsolutePath(),
                                        "node_modules", "infrastructure-components", "dist", "index.js"),

                                    // required of the routed-app
                                    "react-router-dom": path.join(
                                        require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").currentAbsolutePath(),
                                        "node_modules", "react-router-dom"),

                                    // required of the data-layer / apollo
                                    "react-apollo": path.join(
                                        require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").currentAbsolutePath(),
                                        "node_modules", "react-apollo"),
                                }, {
                                    __ISOMORPHIC_ID__: `"${component.instanceId}"`,

                                    // when there is a DataLayer, we provide it, otherwise an empty string
                                    __DATALAYER_ID__: `"${args["datalayerid"] !== undefined ? args["datalayerid"] : ""}"`
                                }
                            ),
                            props.parserMode === PARSER_MODES.MODE_DEPLOY //isProd
                        )
                    }
                ],

                postBuilds: [],
            }
        }
    }

    return result;

};