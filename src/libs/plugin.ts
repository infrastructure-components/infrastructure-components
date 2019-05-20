import { IConfigParseResult } from './config-parse-result';
import * as deepmerge from 'deepmerge';


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


export const forwardChildPostBuilds = (childConfigs: Array<IConfigParseResult>) => (
    childConfigs.reduce((result, config) => result.concat(config.postBuilds), [])
);


/**
 * provide all client configs in a flat list
 */
export const forwardChildWebpackConfigs = (childConfigs: Array<IConfigParseResult>) => {
    return childConfigs.reduce((result, config) => result.concat(...config.webpackConfigs), []);
}


/**
 * provide all client configs in a flat list
 */
export const forwardChildIamRoleStatements = (childConfigs: Array<IConfigParseResult>) => {

    return childConfigs.reduce((result, config) => {

        //console.log("reduce iam: ", config.iamRoleStatements);
        const statements = (config.iamRoleStatements !== undefined && Array.isArray(config.iamRoleStatements)) ?
            config.iamRoleStatements : [];

        //console.log("iam result: ", statements)

        return result.concat(statements);
    }, [])
};
/*
export const mergeIamRoleStatements = (statements: Array<any>) => {
    return deepmerge.all(statements);
};*/