
import { IConfigParseResult } from '../libs/config-parse-result';
import { IPlugin, forwardChildWebpackConfigs, forwardChildPostBuilds } from '../libs/plugin';
import { isIdentity } from './identity-component';
import * as deepmerge from 'deepmerge';

/**
 * Parameters that apply to the whole Plugin, passed by other plugins
 */
export interface IIdentityPlugin {

}

/**
 * We require an IdentityPlugin to forward the configuration from lower level webapps
 * TODO: refactor so that we don't need such dummy plugins!
 */
export const IdentityPlugin = (props: IIdentityPlugin): IPlugin => {
    const path = require('path');

    const result: IPlugin = {
        applies: (component):boolean => {

            return isIdentity(component);
        },

        // convert the component into configuration parts
        // while the component is of Type `any`, its props must be of type `IDataLayerArgs` | `IDataLayerProps`
        process: (component:any,
                  childConfigs:Array<IConfigParseResult>,
                  infrastructureMode:string | undefined
        ):IConfigParseResult => {


            return {

                slsConfigs: deepmerge.all(childConfigs.map(config => config.slsConfigs)),

                // add the server config
                webpackConfigs: forwardChildWebpackConfigs(childConfigs),

                postBuilds: forwardChildPostBuilds(childConfigs),

                /* THESE VALUES MUST NOT BE PROVIDED BY A CHILD, THEY ARE NOT FORWARED UPWARDS

                environments: environments,

                //stackName: component.stackName,

                assetsPath: component.assetsPath,

                buildPath: component.buildPath,

                region: component.region,

                domain: domain,

                certArn: certArn,

                supportOfflineStart: true,

                supportCreateDomain: true
                   */
            }
        }
    };


    return result;

};