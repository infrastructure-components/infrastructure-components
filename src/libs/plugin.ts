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
