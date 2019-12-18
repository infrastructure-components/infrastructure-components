/**
 * Created by frank.zickert on 05.04.19.
 */

import { getChildrenArray } from './index';
import Types from '../types';


/**
 * loads the specified configuration into a Javascript object
 *
 * @param configFilePath
 */
export function loadConfiguration(configFilePath: string, infrastructureMode: string | undefined) {

    //console.log("loadConfiguration");
    return loadConfigurationFromModule(require(configFilePath), infrastructureMode);
}

export function loadConfigurationFromModule(configModule: any, infrastructureMode: string | undefined) {
    //console.log("loadConfigurationFromModule");
    return loadInfrastructureComponent(configModule.default,infrastructureMode);
}


/**
 * Modes of loading, make sure that during RUNTIME mode, only things are used that exist in webpack- web-mode!
 *
 * @type {{COMPILATION: string, RUNTIME: string}}
 */
export const INFRASTRUCTURE_MODES = {
    /**
     * When packing the application
     */
    COMPILATION : "COMPILATION",

    /**
     * when the app actually runs
     */
    RUNTIME: "RUNTIME"
}

/**
 * Loads an InfrastructureComponent (of any type)
 */
export const loadInfrastructureComponent = (component, infrastructureMode: string | undefined) => {

    //console.log("loadInfrastructureComponent");

    // when the component is an array, return it
    if (component !== undefined && Array.isArray(component) && component.length > 0) {
        return component.map(c => loadInfrastructureComponent(c, infrastructureMode))
    }

    try {


        // first load the children!
        const children = getChildrenArray(component.props).reduce((result, child) => {
            return result.concat(loadInfrastructureComponent(child, infrastructureMode))
        }, []);

        //console.log("parseInfrastructureComponent: ", component, children);


        // overwrite the children in the props
        const props = Object.assign({}, component.props, {
            children: children
        });

        // now load the component at hand
        const params = Object.assign({
            infrastructureMode: infrastructureMode,
        }, props);

        const result = component.type(params);

        //console.log("parsed InfrastructureComponent: ", result);

        if (result.infrastructureType == undefined) {
            //console.log("not an infrastructure-component: ", result);

            return loadInfrastructureComponent(result,infrastructureMode);
        }

        //console.log("result: ", result);


        return result;

    } catch (error) {
        console.error("NOT an infrastructure component --> ", error);
        return undefined;
    };
};


/**
 * Get the searched object from the configuration, if it exists
 *
 * This function runs on the compiled/webpacked bundle (Plugins removed!!)
 *
 * @param component
 */
export function extractObject(component: any, infrastructureType: string, instanceId: string) {
    if (component !== undefined &&
        component.infrastructureType === infrastructureType &&
        component.instanceId === instanceId
    ) {
        return component;
    } else {
        return getChildrenArray(component).reduce(
            (found, child) => found !== undefined ? found : extractObject(child, infrastructureType, instanceId),
            undefined
        )
    }
}
