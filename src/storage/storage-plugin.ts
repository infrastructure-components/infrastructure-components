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

            /**
             * setup a local S3, only if we start it locally
             */
            const localS3Config = props.parserMode !== PARSER_MODES.MODE_START ? {} : {

                plugins: ["serverless-s3-local"],

                /* see: https://www.npmjs.com/package/serverless-dynamodb-local */
                custom: {
                    "s3": {
                        port: 3002,
                        directory: "/.s3"
                    }
                },

                provider: {
                    staticBucket: "${self:provider.stackName, 'locals3'}",
                }
            };

            return {
                slsConfigs: deepmerge.all([
                    localS3Config
                ].concat(childConfigs.map(config => config.slsConfigs))),

                // add the server config
                webpackConfigs: childConfigs.reduce((result, config) => result.concat(config.webpackConfigs), []),

                postBuilds: childConfigs.reduce((result, config) => result.concat(config.postBuilds), []),

                iamRoleStatements: forwardChildIamRoleStatements(childConfigs)
            }
        }
    }

    return result;

};