import {IRedirect, IRoute} from "../iso_src/routed-app";
import {IDataLayer} from "../lib/data-layer";

export interface IClientApp {

    /**
     * a unique id or name of the route
     */
    id: string,

    /**
     * the relative  path of the route, e.g. "/" for the root, or "/something", or "*" for any
     * Can be a regex to filter the paths of the routes and redirects
     */
    path: string,

    /**
     * The http method of the route, e.g. get, post, ...
     */
    method: string,

    /**
     * Array of Routes that this app serves
     */
    routes: Array<IRoute>,

    /**
     * Array of Redirects
     */
    redirects: Array<IRedirect>,

    /**
     * The DataLayer implementation, if used
     */
    dataLayer?: IDataLayer,

    /**
     * Function that creates the ClientApp corresponding to the middleware-rendering
     */
    //createClientApp: () => ReactNode,

    /**
     * array of callbacks to be used of a route before handing over to the "*"-callback
     */
    middlewareCallbacks: Array<any>,



}

export const getChildrenArray = (component) => {
    return Array.isArray(component.children) ? component.children : [component.children];
};

/**
 * Evaluates the children of the component and applies them,
 *
 * to be called once the app is running.
 *
 * @param ClientAppComponent
 *
export const applyAppClientModules = (clientAppComponent): IClientApp => {

    //console.log("clientAppComponent: ", clientAppComponent);
    getChildrenArray(clientAppComponent).forEach(child => {

        const parsedChild = parseCustomComponent(child);

        //console.log("applyAppClientModules: ", parsedChild, child);
        if (parsedChild !== undefined  && parsedChild.infrastructureType === "datalayer" ) {

            console.log("found data layer: ", parsedChild);

            //&& parsedChild.toDataLayer !== undefined
            //clientAppComponent.dataLayer = parsedChild.toDataLayer()
        }


        
    });


    //console.log("create server, clientApp: " , clientApp.children[0].props);
    
    return clientAppComponent;
}*/