import * as deepmerge from 'deepmerge';
import {IEnvironmentArgs} from "../environment/environment-component";
import {forwardChildIamRoleStatements} from "./plugin";

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


    iamRoleStatements: Array<any>,


    environments?: Array<IEnvironmentArgs>,


    // the following fields are taken directly from the TopLevelConfiguration
    stackName?: string,

    // may not be there in every app!, e.g. SPA does not use it
    assetsPath?: string,

    buildPath?: string,

    region?: string,

    domain?: string,

    /** if an environment provides the ARN of a certificate, required of SPAs */
    certArn?: string,

    /**
     * optional flag (default: true), whether the `start` command should be added to the scripts,
     * evaluation of the flag takes place in [[infrastructure-scripts.build.writeScriptsToPackageJson]]
     */
    supportOfflineStart?: boolean,

    /**
     * optional flag (default: true), whether the `domain` command should be added to the scripts,
     * evaluation of the flag takes place in [[infrastructure-scripts.build.writeScriptsToPackageJson]]
     */
    supportCreateDomain?: boolean
}

/**
 * Merges a list of ConfigParseResults into a single ParseResult, with a single sls-congiguration
 *
 * @param results
 */
export function mergeParseResults(results: Array<IConfigParseResult>) {

    //console.log("mergeParseResults: ", results);

    return results.reduce((merged, item) => {
        //console.log("afterMerge: ", merged.slsConfigs);

        //console.log("mergeParseResults: ", item.slsConfigs);


        return {
            slsConfigs: deepmerge.all([
                ...(Array.isArray(item.slsConfigs) ? item.slsConfigs : [item.slsConfigs])
            ], merged.slsConfigs),
            webpackConfigs: merged.webpackConfigs.concat(item.webpackConfigs),
            postBuilds: merged.postBuilds.concat(item.postBuilds),
            environments: (merged.environments !== undefined ? merged.environments : []).concat(
                item.environments !== undefined ? item.environments : []),

            iamRoleStatements: merged.iamRoleStatements.concat(item.iamRoleStatements !== undefined ? item.iamRoleStatements : []),

            // usually, these fields should not be defined here, but only from the top-level configuration
            stackName: item.stackName !== undefined ? item.stackName : merged.stackName,
            assetsPath: item.assetsPath !== undefined ? item.assetsPath : merged.assetsPath,
            buildPath: item.buildPath !== undefined ? item.buildPath : merged.buildPath,
            region: item.region !== undefined ? item.region : merged.region,
            domain: item.domain !== undefined ? item.domain : merged.domain,
            certArn: item.certArn !== undefined ? item.certArn : merged.certArn,
            supportOfflineStart: item.supportOfflineStart !== undefined ? item.supportOfflineStart : merged.supportOfflineStart,
            supportCreateDomain: item.supportCreateDomain !== undefined ? item.supportCreateDomain : merged.supportCreateDomain
        }
    }, {
        slsConfigs: {},
        webpackConfigs: [],
        postBuilds: [],
        iamRoleStatements: []
    })
}