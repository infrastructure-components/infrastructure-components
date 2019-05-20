/**
 * This module must not import anything globally not workin in web-mode! if needed, require it within the functions
 */
import { IConfigParseResult } from '../libs/config-parse-result';
import { IPlugin } from '../libs/plugin';
import { isService } from './service-component'
import { PARSER_MODES } from '../libs/parser';
import * as deepmerge from 'deepmerge';


/**
 * Parameters that apply to the whole Plugin, passed by other plugins
 */
export interface IWebAppPlugin {

}

/**
 * A Plugin to detect WebApp-Components
 *
 * IMPORTANT: The WebAppPlugin provides as webPackConfigs a list of functions (to take further args!)
 * This must be considered when being forwarded!
 *
 * @param props
 */
export const ServicePlugin = (props: IWebAppPlugin): IPlugin => {
    const path = require('path');

    const result: IPlugin = {
        // identify Isomorphic-App-Components
        applies: (component): boolean => {

            return isService(component);
        },

        // convert the component into configuration parts
        // while the component is of Type `any`, its props must be of type `IWebApp`
        process: (
            component: any,
            childConfigs: Array<IConfigParseResult>,
            infrastructureMode: string | undefined
        ): IConfigParseResult => {

            return {
                slsConfigs: deepmerge.all(childConfigs.map(config => config.slsConfigs)),

                // add the server config
                webpackConfigs: childConfigs.reduce((result, config) => result.concat(config.webpackConfigs), []),

                postBuilds: childConfigs.reduce((result, config) => result.concat(config.postBuilds), []),
            }
        }
    }

    return result;

};