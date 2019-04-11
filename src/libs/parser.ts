
import * as deepmerge from 'deepmerge';

import { IPlugin } from './plugin';
import { IConfigParseResult, mergeParseResults } from './config-parse-result'
import { extractPlugins, isConfiguration } from "../types/configuration";
import { getChildrenArray } from './index';
import { INFRASTRUCTURE_MODES, loadInfrastructureComponent } from './loader';

/**
 * parses the configuration for plugins and returns a list of the plugins (objects)
 *
 * @param configPath the path to the compiled and evaluable configuration
 * @param origConfigPath the path to the original uncompiled configuration source!
 */
export function parseForPlugins (parsedComponent: any, origConfigPath: string, stage: string | undefined): Array<IPlugin> {

    //console.log("configPath: ", configPath);

    if (isConfiguration(parsedComponent)) {
        return extractPlugins(parsedComponent, origConfigPath, stage);

    } else {
        console.error("main component is not a valid app!")
        return [];
    }

};


/**
 * parses a configuration, this configuration must export the main component as default
 *
 *
 * @param component (main component of the configuration)
 * @param compileMode set to true to run the parser with a statically loaded configuration (without objects)
 */

export function extractConfigs(parsedComponent, plugins, infrastructureMode: string | undefined): IConfigParseResult {

    const results: Array<IConfigParseResult> = plugins

        // check for plugins to apply
        .filter(plugin => plugin.applies(parsedComponent))

        // apply applicable plugins
        .map(plugin => {
            const childConfigs = getChildrenArray(parsedComponent).map(child => extractConfigs(child, plugins, infrastructureMode))
            const r= plugin.process(parsedComponent, childConfigs, infrastructureMode);
            console.log("result: ", r);
            return r;
        })


    return mergeParseResults(results);

};
