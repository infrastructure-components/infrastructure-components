import React, {ReactNode} from 'react';

import Types from '../types';
import { IComponent } from "../types/component";
import { IInfrastructure } from "../types";

import { isMiddleware } from '../middleware/middleware-component';
import { getChildrenArray } from '../libs';


export const SERVICE_INSTANCE_TYPE = "ServiceComponent";


/**
 * Specifies all the properties that a Client-Component must have
 */
export interface IServiceArgs {

    /**
     * a unique id or name of the service
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
export interface IServiceProps {

    /**
     * A Webapp component supports middlewares, defines as direct children
     */
    middlewares: Array<any>,


    /**
     * A function that the DataLayer provides, it lets the WebApp get the DataLayer Id
     */
    setDataLayerId: (dataLayerId: string) => void,

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
export function isService(component) {
    return component !== undefined && component.instanceType === SERVICE_INSTANCE_TYPE
}

/**
 * The WebApp is a client that runs in the browser, SPA or SSR
 *
 * @param props
 */
export default (props: IServiceArgs | any) => {

    //console.log ("webapp: ", props);

    // the ServiceComponent must have all the properties of IClient
    const componentProps: IInfrastructure & IComponent = {
        infrastructureType: Types.INFRASTRUCTURE_TYPE_COMPONENT,
        instanceType: SERVICE_INSTANCE_TYPE,
        instanceId: props.id,

        insulatesChildComponent: (child) => {
            // a webapp insulates (handles itself) middlewares and routes and does not privide to higher levels
            return isMiddleware(child)
        }
    };

    const serviceProps: IServiceProps = {
        middlewares: getChildrenArray(props.children)
            .filter(child => isMiddleware(child)),

        setDataLayerId: (dataLayerId: string) => {
            props.dataLayerId = dataLayerId;
        }
    }

    return Object.assign(props, componentProps, serviceProps);

};
