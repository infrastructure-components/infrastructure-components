import React, {ReactNode} from 'react';

import {IComponent} from "../types/component";
import Types, { IInfrastructure } from "../types";

import { isMiddleware } from '../middleware/middleware-component';
import {getChildrenArray, findComponentRecursively} from '../libs';


export const ROUTE_INSTANCE_TYPE = "RouteComponent";


/**
 * Specifies all the properties that a Route-Component must have
 */
export interface IRouteArgs {

    path: string,

    name: string,

    render?: any,

    component?: any,

    exact?: boolean,
}


/**
 * specifies the properties that an Route-Component has during runtime
 */
export interface IRouteProps {

    /**
     * A route component supports middlewares, defines as direct children
     */
    middlewares: Array<any>,



    isSecured?: boolean
}


/**
 * The WebApp is a client that runs in the browser, SPA or SSR
 *
 * @param props
 */
export default (props: IRouteArgs | any) => {

    //console.log ("route: ",props );

    const componentProps: IInfrastructure & IComponent = {
        infrastructureType: Types.INFRASTRUCTURE_TYPE_COMPONENT,
        instanceType: ROUTE_INSTANCE_TYPE,
        instanceId: undefined, // middlewares cannot be found programmatically!

        insulatesChildComponent: (child) => {
            // a route insulates (handles itself) middlewares and does not privide to higher levels
            return isMiddleware(child)
        }
    };

    const routeProps: IRouteProps = {
        middlewares:findComponentRecursively(props.children, isMiddleware),
    }

    return Object.assign({}, props, componentProps, routeProps, {exact: props.exact === undefined ? true : props.exact});


};

export const isRoute = (component) => {

    return component !== undefined &&
        component.instanceType === ROUTE_INSTANCE_TYPE;
};