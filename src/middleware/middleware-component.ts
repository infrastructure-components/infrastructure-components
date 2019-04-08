import React, {ReactNode} from 'react';

import Types from '../types';
import { IComponent} from "../types/component";
import { IInfrastructure } from "../types";


export const MIDDLEWARE_INSTANCE_TYPE = "MiddlewareComponent";


/**
 * Specifies all the properties that a Middleware-Component must have
 */
export interface IMiddleware {

    /**
     * entry point of the middleware
     */
    callback: any,

}

/**
 * The Middleware (is an Express-Middleware!) has no Plugin because it requires no
 *
 * @param props
 */
export default (props: IMiddleware | any) => {

    //console.log ("middleware: ",props );

    // the component must have the properties of IComponent
    const componentProps: IInfrastructure & IComponent = {
        infrastructureType: Types.INFRASTRUCTURE_TYPE_COMPONENT,
        instanceType: MIDDLEWARE_INSTANCE_TYPE,
        instanceId: undefined, // middlewares cannot be found programmatically!
    };

    return Object.assign(componentProps, props);


};


export const isMiddleware = (component) => {

    return component !== undefined &&
        component.instanceType === MIDDLEWARE_INSTANCE_TYPE;
};
