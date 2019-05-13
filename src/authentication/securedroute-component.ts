import React, {ReactNode} from 'react';

import createRoute, { IRouteArgs, IRouteProps } from '../route/route-component';

export const SECUREDROUTE_INSTANCE_TYPE = "SecuredRouteComponent";


/**
 * The SecuredRoute takes the same arguments as the Route!
 *
 * @param props
 */
export default (props: IRouteArgs | any) => {

    return Object.assign(props, createRoute(props), {
        // we overwrite the type
        instanceType: SECUREDROUTE_INSTANCE_TYPE,

    });


};

export const isSecuredRoute = (component) => {

    return component !== undefined &&
        component.instanceType === SECUREDROUTE_INSTANCE_TYPE;
};