
import { IConfigParseResult } from '../libs/config-parse-result';
import { IPlugin } from '../libs/plugin';
import { isDataLayer } from './template-component'
import * as deepmerge from 'deepmerge';
import {PARSER_MODES} from "../libs/parser";

/**
 * Parameters that apply to the whole Plugin, passed by other plugins
 */
export interface IDataLayerPlugin {

}

/**
 * @param props
 */
export const DataLayerPlugin = (props: IDataLayerPlugin): IPlugin => {
    const path = require('path');

    const result: IPlugin = {
        applies: (component):boolean => {

            return isDataLayer(component);
        },

        // convert the component into configuration parts
        // while the component is of Type `any`, its props must be of type `IDataLayerArgs` | `IDataLayerProps`
        process: (component:any,
                  childConfigs:Array<IConfigParseResult>,
                  infrastructureMode:string | undefined
        ):IConfigParseResult => {


            return {


                slsConfigs: deepmerge.all([]),

                webpackConfigs: [],

                postBuilds: [],

            }
        }
    };


    return result;

};