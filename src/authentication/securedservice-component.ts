import React, {ReactNode} from 'react';

import createRoute, { IRouteArgs, IRouteProps } from '../route/route-component';

export const SECUREDSERVICE_INSTANCE_TYPE = "SecuredServiceComponent";


/**
 * The SecuredRoute takes the same arguments as the Route!
 *
 * @param props
 */
export default (props: IRouteArgs | any) => {

    return Object.assign(props, createRoute(props), {
        // we overwrite the type
        instanceType: SECUREDSERVICE_INSTANCE_TYPE,

        isSecured: true
    });


};

export const isSecuredService = (component) => {

    return component !== undefined &&
        component.instanceType === SECUREDSERVICE_INSTANCE_TYPE;
};