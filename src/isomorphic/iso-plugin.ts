/**
 * This module must not import anything globally not workin in web-mode! if needed, require it within the functions
 */
import { isIsomorphicApp } from './iso-component';
import { resolveAssetsPath } from '../libs/iso-libs';
import * as deepmerge from 'deepmerge';
import { IConfigParseResult } from '../libs/config-parse-result';
import { IPlugin } from '../libs/plugin';

/**
 * Parameters that apply to the whole Plugin, passed by other plugins
 */
export interface IIsoPlugin {

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
 * A Plugin to detect Isomorphic-App-Components
 * @param props
 */
export const IsoPlugin = (props: IIsoPlugin): IPlugin => {

    //console.log("configFilePath: " , props.configFilePath);

    const result: IPlugin = {
        // identify Isomorphic-App-Components
        applies: (component): boolean => {

            return isIsomorphicApp(component);
        },

        // convert the component into configuration parts
        process: (
            component: any,
            childConfigs: Array<IConfigParseResult>,
            infrastructureMode: string | undefined
    ): IConfigParseResult => {

            const path = require('path');

            // we use the hardcoded name `server` as name
            const serverName = "server";

            const serverBuildPath = path.join(require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").currentAbsolutePath(), props.buildPath);

            // the isomorphic app has a server application
            const serverWebPack = require("../../../infrastructure-scripts/dist/infra-comp-utils/webpack-libs").complementWebpackConfig(
                require("../../../infrastructure-scripts/dist/infra-comp-utils/webpack-libs").createServerWebpackConfig(
                    "./"+path.join("node_modules", "infrastructure-components", "dist" , "assets", "server.js"), //entryPath: string,
                    serverBuildPath, //use the buildpath from the parent plugin
                    serverName, // name of the server
                    {
                        __CONFIG_FILE_PATH__: require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").pathToConfigFile(props.configFilePath), // replace the IsoConfig-Placeholder with the real path to the main-config-bundle

                    }, {
                        __ISOMORPHIC_ID__: `"${component.instanceId}"`,
                        __ASSETS_PATH__: `"${component.assetsPath}"`,
                        __RESOLVED_ASSETS_PATH__: `"${resolveAssetsPath(
                            component.buildPath,
                            serverName, 
                            component.assetsPath ) 
                        }"`
                    }
                )
            );

            // provide all client configs in a flat list
            const webpackConfigs: any = childConfigs.reduce((result, config) => result.concat(config.webpackConfigs), []);

            const copyAssetsPostBuild = () => {
                console.log("now copy the assets!");

                webpackConfigs.map(config => require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").copyAssets( config.output.path, path.join(serverBuildPath, serverName, component.assetsPath)));
            };

            const domain = childConfigs.map(config => config.domain).reduce((result, domain) => result !== undefined ? result : domain, undefined);
            const certArn = childConfigs.map(config => config.certArn).reduce((result, certArn) => result !== undefined ? result : certArn, undefined);


            const domainConfig = domain !== undefined ? {
                    plugins: "- serverless-domain-manager",

                    custom: {
                        customDomain: {
                            domainName: component.domain,
                            basePath: '',
                            stage: component.name,
                            createRoute53Record: true
                        }
                    }

                } : {};

            return {
                slsConfigs: deepmerge.all([
                    require("../../../infrastructure-scripts/dist/infra-comp-utils/sls-libs").toSlsConfig(
                        component.stackName,
                        serverName,
                        component.buildPath,
                        component.assetsPath,
                        component.region),

                    // add the domain config
                    domainConfig,

                    ...childConfigs.map(config => config.slsConfigs)
                    ]
                ),
                
                // add the server config 
                webpackConfigs: webpackConfigs.concat([serverWebPack]),

                postBuilds: childConfigs.reduce((result, config) => result.concat(config.postBuilds), [copyAssetsPostBuild]),

                environments: childConfigs.reduce((result, config) => (result !== undefined ? result : []).concat(config.environments !== undefined ? config.environments : []), []),

                stackName: component.stackName,

                assetsPath: component.assetsPath,

                buildPath: component.buildPath,

                region: component.region,

                domain: domain,

                certArn: certArn,

                supportOfflineStart: true,

                supportCreateDomain: true
            }
        }
    }

    return result;

};