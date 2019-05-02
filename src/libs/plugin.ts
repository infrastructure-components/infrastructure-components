import { IConfigParseResult } from './config-parse-result';


export interface IPlugin {

    /**
     * check whether the plugin applies to the provided component
     * @param component to process
     * @return boolean whether the plugin applies to the component
     */
    applies: (component) => boolean,

    /**
     * process the provided component. return a tuple {Array<slsConfigs>, Array<webpackConfigs>, Array<postBuilds>}
     *
     * @param component component that this plugin applies to
     *
     * @param childConfigs list of the parsing result of the children
     * type: Array<{Array<slsConfigs>, Array<webpackConfigs>, Array<postBuilds>}>
     * @param compileMode boolean, if true, the components have beeen loaded statically only!
     */
    process: (
        component: any,
        childConfigs: Array<IConfigParseResult>,
        infrastructureMode: string | undefined,
        stage: string | undefined) => IConfigParseResult,
}

/**
 * Reduces the Webpack-Configurations of the component's children into a single one webpack-configuration
 *
 * @param childConfigs array of IConfigParseResult provided by the children of the Plugin-Components
 */
export const reduceChildWebpackConfigs = (childConfigs: Array<IConfigParseResult>) => (
    childConfigs.reduce((result, config) => result.concat(config.webpackConfigs), [])
);

/**
 * Forwards the Webpack-Configurations of the component's children, i.e. when there are multiple
 * children with Webpack-configuration, these are forwarded as-is
 *
 * @param childConfigs array of IConfigParseResult provided by the children of the Plugin-Components
 */
export const forwardChildWebpackConfigs = (childConfigs: Array<IConfigParseResult>) => (
    childConfigs.map(config => config.webpackConfigs)
);


/**
 * provide all client configs in a flat list
 */
export const flattenChildWebpackConfigs = (childConfigs: Array<IConfigParseResult>) => {
    return childConfigs.reduce((result, config) => result.concat(...config.webpackConfigs), []);
}