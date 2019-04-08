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
