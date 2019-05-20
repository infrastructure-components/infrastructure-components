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

    console.log("isoConfig: ", isoConfig)

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
    console.log("urlPath: ", urlPath);

    /*

    const hostname = process.env.DOMAIN_URL;

    console.log(`hostname ${hostname}`);
    */

    // apparently, the fetch does not require the hostname...why?
    await fetch(`${urlPath}`,{
        method: serviceComponent.method,
        body: JSON.stringify(args),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
            "Accept-Charset": "utf-8"
        }
    }).then(result => {
        console.log("post result: ", result);
        onResult(result);

    }).catch(error => {
        console.error("post-error: ", error);
        onError(error);
    });
    //
}