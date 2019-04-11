/**
 * This module must not import anything globally not workin in web-mode! if needed, require it within the functions
 */
import { IConfigParseResult } from '../libs/config-parse-result';
import { IPlugin } from '../libs/plugin';
import { isEnvironment } from './environment-component'
import * as deepmerge from 'deepmerge';

/**
 * Parameters that apply to the whole Plugin, passed by other plugins
 */
export interface IEnvironmentPlugin {

    /**
     * the stage is the environment to apply
     */
    stage: string,
}

/**
 * A Plugin to detect WebApp-Components
 * @param props
 */
export const EnvironmentPlugin = (props: IEnvironmentPlugin): IPlugin => {
    const path = require('path');

    const result: IPlugin = {
        // identify Isomorphic-App-Components
        applies: (component):boolean => {

            return isEnvironment(component);
        },

        // convert the component into configuration parts
        // while the component is of Type `any`, its props must be of type `IWebApp`
        process: (component:any,
                  childConfigs:Array<IConfigParseResult>,
                  infrastructureMode:string | undefined
        ):IConfigParseResult => {

            // we ignore any environment that does not match the specified one!
            if (props.stage !== component.name) {
                console.log(`environment ${component.name} does not apply to specified ${props.stage}`);
                return {
                    slsConfigs: [],
                    webpackConfigs: [],
                    postBuilds: []
                }
            }


            return {

                slsConfigs: deepmerge.all([
                    {
                        // set the stage-name
                        provider: {
                            STAGE: component.name
                        }
                    },
                    component.offlinePort !== undefined ? {
                        provider: {
                            PORT: component.offlinePort
                        }
                    } : {},
                    component.stagePath !== undefined ? {
                        provider: {
                            STAGE_PATH: component.stagePath
                        }
                    } : {},
                    component.domain !== undefined ? {
                        plugins: ["serverless-domain-manager"],

                        custom: {
                            customDomain: {
                                domainName: component.domain,
                                basePath: '',
                                stage: component.name,
                                createRoute53Record: true
                            }
                        }

                    } : {}
                ]),

                webpackConfigs: [],

                postBuilds: [],
            }
        }
    };


    return result;

};