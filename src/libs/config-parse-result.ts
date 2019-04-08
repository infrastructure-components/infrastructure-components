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
            postBuilds: merged.postBuilds.concat(item.postBuilds)
        }
    }, {
        slsConfigs: {},
        webpackConfigs: [],
        postBuilds: []
    })
}