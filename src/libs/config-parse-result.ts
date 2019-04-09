import * as deepmerge from 'deepmerge';

export interface IConfigParseResult {

    /**
     * Listof js-objects or single js-object to be merged into serverless.yml
     */
    slsConfigs: any | Array<any>,

    /**
     * list of js-objects to be transformed into webpack-configs (each config creates a separate bundle)
     */
    webpackConfigs: Array<any>,

    /**
     * list of modules to apply to the final bundle
     *
     * TODO specify type!!!
     */
    postBuilds: Array<any>,

    // the following fields are taken directly from the TopLevelConfiguration
    stackName?: string,
    
    assetsPath?: string,

    buildPath?: string,

    region?: string
}

/**
 * Merges a list of ConfigParseResults into a single ParseResult, with a single sls-congiguration
 *
 * @param results
 */
export function mergeParseResults(results: Array<IConfigParseResult>) {

    //console.log("mergeParseResults: ", results);

    return results.reduce((merged, item) => {
        return {
            slsConfigs: deepmerge.all([merged.slsConfigs, item.slsConfigs]),
            webpackConfigs: merged.webpackConfigs.concat(item.webpackConfigs),
            postBuilds: merged.postBuilds.concat(item.postBuilds),

            // usually, these fields should not be defined here, but only from the top-level configuration
            stackName: item.stackName !== undefined ? item.stackName : merged.stackName,
            assetsPath: item.assetsPath !== undefined ? item.assetsPath : merged.assetsPath,
            buildPath: item.buildPath !== undefined ? item.buildPath : merged.buildPath,
            region: item.region !== undefined ? item.region : merged.region
        }
    }, {
        slsConfigs: {},
        webpackConfigs: [],
        postBuilds: []
    })
}