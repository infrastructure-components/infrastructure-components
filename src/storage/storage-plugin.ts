/**
 * This module must not import anything globally not working in web-mode! if needed, require it within the functions
 */
import { IConfigParseResult } from '../libs/config-parse-result';
import {IPlugin, forwardChildIamRoleStatements} from '../libs/plugin';
import { isStorage } from './storage-component'
import { PARSER_MODES } from '../libs/parser';
import * as deepmerge from 'deepmerge';


/**
 * Parameters that apply to the whole Plugin, passed by other plugins
 */
export interface IStoragePlugin {
    /**
     * one of the [[PARSER_MODES]]
     */
    parserMode: string,

    /**
     * path to a directory where we put the final bundles
     */
    buildPath: string,
}

/**
 * A Plugin to detect Storage-Components
 */
export const StoragePlugin = (props: IStoragePlugin): IPlugin => {
    const path = require('path');

    const result: IPlugin = {
        // identify Components
        applies: (component): boolean => {

            return isStorage(component);
        },

        // convert the component into configuration parts
        // while the component is of Type `any`, its props must be of type `IWebApp`
        process: (
            component: any,
            childConfigs: Array<IConfigParseResult>,
            infrastructureMode: string | undefined
        ): IConfigParseResult => {

            const copyAssetsPostBuild = () => {
                console.log("check for >>copyAssetsPostBuild<<", props.buildPath);

                /**
                 * Sync the files with the folder in S3
                 */
                if (props.parserMode !== PARSER_MODES.MODE_DOMAIN && props.parserMode !== PARSER_MODES.MODE_DEPLOY) {
                    // always copy the assets, unless we setup the domain
                    console.log("copyAssetsPostBuild: now copy the assets!");

                    const storageBuildPath = path.join(require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").currentAbsolutePath(), props.buildPath);

                    require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").copyAssets(
                        path.join(storageBuildPath, "file-management"), path.join(storageBuildPath, component.id)
                    );

                } else {
                    //copyAssets
                }

                /*   if (props.parserMode !== PARSER_MODES.MODE_DOMAIN && props.parserMode !== PARSER_MODES.MODE_DEPLOY) {
                 // always copy the assets, unless we setup the domain
                 console.log("copyAssetsPostBuild: now copy the assets!");

                 webpackConfigs.map(config => require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").copyAssets( config.output.path, path.join(serverBuildPath, serverName, component.assetsPath)));

                 } else {
                 // delete the assets folder for we don't want to include all these bundled files in the deployment-package
                 const rimraf = require("rimraf");
                 rimraf.sync(path.join(serverBuildPath, serverName, component.assetsPath));

                 }
                 */
            };

            return {
                slsConfigs: deepmerge.all(childConfigs.map(config => config.slsConfigs)),

                // add the server config
                webpackConfigs: childConfigs.reduce((result, config) => result.concat(config.webpackConfigs), []),

                postBuilds: childConfigs.reduce((result, config) => result.concat(config.postBuilds), [copyAssetsPostBuild]),

                iamRoleStatements: forwardChildIamRoleStatements(childConfigs)
            }
        }
    }

    return result;

};