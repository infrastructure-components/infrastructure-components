import React, {ReactNode} from 'react';

import Types from '../types';
import { IClient } from "../types/client";
import { IInfrastructure } from "../types";

import { isMiddleware } from '../middleware/middleware-component';
import { isRoute } from '../route/route-component';
import { getChildrenArray } from '../libs';


export const WEBAPP_INSTANCE_TYPE = "WebAppComponent";


/**
 * Specifies all the properties that a Client-Component must have
 */
export interface IWebAppArgs {

    /**
     * a unique id or name of the webapp
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
}


/**
 * specifies the properties that an WebApp-Component has during runtime
 */
export interface IWebAppProps {

    /**
     * A Webapp component supports middlewares, defines as direct children
     */
    middlewares: Array<any>,

    /**
     * Routes of the webapp
     */
    routes: Array<any>,

    /**
     * redirects of the webapp
     */
    redirects: Array<any>,

    /**
     * The id of the datalayer - if the webapp applies to one.
     * filled by the DataLayer
     */
    dataLayerId?: any
}

/**
 * identifies a component as a WebApp: it implements all the required fields
 *
 * @param component to be tested
 */
export function isWebApp(component) {
    return component !== undefined && component.instanceType === WEBAPP_INSTANCE_TYPE
}

/**
 * The WebApp is a client that runs in the browser, SPA or SSR
 *
 * @param props
 */
export default (props: IWebAppArgs | any) => {

    //console.log ("webapp: ", props);

    // the WebAppComponent must have all the properties of IClient
    const clientProps: IInfrastructure & IClient = {
        infrastructureType: Types.INFRASTRUCTURE_TYPE_CLIENT,
        instanceType: WEBAPP_INSTANCE_TYPE,
        instanceId: props.id
    };

    const webappProps: IWebAppProps = {
        middlewares: getChildrenArray(props.children)
            .filter(child => isMiddleware(child)),

        routes: getChildrenArray(props.children)
            .filter(child => isRoute(child)),

        // TODO add redirects!!!!
        redirects: []
    }

    return Object.assign(props, clientProps, webappProps);

};
