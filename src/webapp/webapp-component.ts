import React, {ReactNode} from 'react';

import Types from '../types';
import { IClient } from "../types/client";
import { IInfrastructure } from "../types";

import { isSecuredRoute } from '../authentication/securedroute-component';
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

    renderHtmlPage?: (html, styles, preloadedState, isomorphicState, helmet, basename, routePath, clientApp, assetsDir) => string,

    /**
     * When specified, we get a function that listens to local route-changes
     * ONLY FOR ISOMORPHIC APPS! needs to be implemented for SPA if required
     *
     * @param location
     * @param action
     */
    listenOnBrowserHistory?: (location, action) => any
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
     * A function that the DataLayer provides, it lets the WebApp get the DataLayer Id
     */
    setDataLayerId: (dataLayerId: string) => void,

    /**
     * The id of the datalayer - if the webapp applies to one.
     * filled by the DataLayer
     */
    dataLayerId?: any,

    /**
     * a function that the AuthenticationComponent provides, it lets the WebApp get the AuthenticatinId
     * @param authenticationId
     */
    setAuthenticationId: (authenticationId: string) => void,

    /**
     * The id of the authentication-component - if the webapp applies to one.
     * filled by the authentication-component
     */
    authenticationId?: any,
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
        instanceId: props.id,

        insulatesChildComponent: (child) => {
            // a webapp insulates (handles itself) middlewares and routes and does not privide to higher levels
            return isMiddleware(child) || isRoute(child);
                /* && !isSecuredRoute(child) -- the WebApp does not hide secured-routes,
                 *  we must allow the authentication component to find, process, and change (add middlewares) them to a normal route
                 */
        }
    };

    const webappProps: IWebAppProps = {
        middlewares: getChildrenArray(props.children)
            .filter(child => isMiddleware(child)),

        routes: getChildrenArray(props.children)
            .filter(child => isRoute(child) || isSecuredRoute(child)),

        // TODO add redirects!!!!
        redirects: [],

        setDataLayerId: (dataLayerId: string) => {
            props.dataLayerId = dataLayerId;
        },

        setAuthenticationId: (authenticationId: string) => {
            props.authenticationId = authenticationId;
        }
    }

    return Object.assign(props, clientProps, webappProps);

};
