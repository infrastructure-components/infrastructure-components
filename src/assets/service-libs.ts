import { extractObject, INFRASTRUCTURE_MODES, loadConfigurationFromModule } from '../libs/loader';
import Types from '../types';
import {getBasename} from '../libs/iso-libs';


/**
 * Convenience function that 
 * @param id
 * @param args
 * @param onResult
 * @param onError
 */
export async function callService(id: string, args: any, onResult: (result: any) => void, onError: (error: any) => void) {

    const path = require("path");
    
    // load the IsomorphicComponent
    // we must load it directly from the module here, to enable the aliad of the config_file_path
    const isoConfig = loadConfigurationFromModule(require('__CONFIG_FILE_PATH__'), INFRASTRUCTURE_MODES.RUNTIME);

    //console.log("isoConfig: ", isoConfig)

    // let's extract it from the root configuration
    const serviceComponent = extractObject(
        isoConfig,
        Types.INFRASTRUCTURE_TYPE_COMPONENT,
        id
    );

    if (!serviceComponent) {
        console.error("could not find service with id: ", id);
        onError(`could not find service with id: ${id}`);
        return;
    }
    
    const urlPath = getBasename() !== undefined ? path.join(getBasename(), serviceComponent.path) : serviceComponent.path;
    //console.log("urlPath: ", urlPath);

    const params = {
        method: serviceComponent.method,

        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
            "Accept-Charset": "utf-8"
        }
    };



    // apparently, the fetch does not require the hostname...why?
    await fetch(
        serviceComponent.method === "POST" ? urlPath : urlPath.concat(
            Object.keys(args).reduce((result, key, index) => result.concat(index > 0 ? "&" : "?", key, "=", args[key]), "")
        ),
        serviceComponent.method === "POST" ? Object.assign({
            body: JSON.stringify(args)
        }, params) : params).then(result => {
        //console.log("post result: ", result);
        onResult(result);

    }).catch(error => {
        //console.error("post-error: ", error);
        onError(error);
    });
    //
}

export function getServiceUrl(id: string, args: any) {

    const path = require("path");

    // load the IsomorphicComponent
    // we must load it directly from the module here, to enable the aliad of the config_file_path
    const isoConfig = loadConfigurationFromModule(require('__CONFIG_FILE_PATH__'), INFRASTRUCTURE_MODES.RUNTIME);

    //console.log("isoConfig: ", isoConfig)

    // let's extract it from the root configuration
    const serviceComponent = extractObject(
        isoConfig,
        Types.INFRASTRUCTURE_TYPE_COMPONENT,
        id
    );

    if (!serviceComponent) {
        console.error("could not find service with id: ", id);
        return undefined;
    }


    const servicePath = Object.keys(args).reduce((res, key) => {
        return res.replace(new RegExp(`:${key}`), args[key])
    }, serviceComponent.path);


    return getBasename() !== undefined ? path.join(getBasename(), servicePath) : servicePath;

}

