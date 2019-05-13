import React, {ReactNode} from 'react';

import {IComponent} from "../types/component";
import Types, { IInfrastructure } from "../types";

import createMiddleware, { isMiddleware } from '../middleware/middleware-component';
import { isWebApp } from '../webapp/webapp-component';
import { isSecuredRoute } from './securedroute-component';
import { ROUTE_INSTANCE_TYPE } from '../route/route-component';
import { getChildrenArray } from '../libs';
import {createAuthMiddleware } from "./auth-middleware";
import cookiesMiddleware from 'universal-cookie-express';

export const AUTHENTICATION_INSTANCE_TYPE = "AuthenticationComponent";

export const AuthenticationProvider = {
    GITHUB: "AUTH_GITHUB"
};

/**
 * This creates a customized middleware that catches an error when the user is not logged in, i.e. it forwards her
 * to the provider's login-page
 *
 * @param clientId as defined in the app of the provider
 * @param callbackUrl as defined in the app of the provider
 * @param provider to create the redirect Url for
 */
export const createRequestLoginMiddleware = (clientId: string, callbackUrl: string, provider: string) => (err, req, res, next) => {
    console.log("check not logged in");
    console.log("we are not logged in! redirect the user to the provider...")

    // `https://medium.com/m/oauth/authorize?client_id=${clientId}&scope=basicProfile,listPublications,publishPost&state=InteractiveMedium&response_type=code&redirect_uri=${callbackUrl}`


    if (provider === AuthenticationProvider.GITHUB) {
        res.redirect(`https://github.com/login/oauth/authorize?scope=user:email&client_id=${clientId}`);
    }

    return;

};

/**
 * suffix to the provider. specifies the -env-variable to hold the clientSecret
 */
const SUFFIX_SECRET = "_SECRET"

/**
 * Specifies all the properties that a Authentication-Component must have
 */
export interface IAuthenticationArgs {

    /**
     * The provider must be a string of AuthenticationProvider
     */
    provider: string,

    /**
     * The clientID provided by the Provider, e.g. from Github
     */
    clientId: string,

    /**
     * a fully qualified url, as specified in the setup of the auth-provider
     */
    callbackUrl: string,


}


/**
 * specifies the properties that an Authentication-Component has during runtime
 */
export interface IAuthenticationProps {

    /**
     * An authentication component supports middlewares, defined as direct children
     *
    middlewares: Array<any>,

    /**
     * For an authentication component is part of an Isomorphic App, it supports webapps, defined as direct children
     *
    webapps: Array<any>*/
}


/**
 * The WebApp is a client that runs in the browser, SPA or SSR
 *
 * @param props
 */
export default (props: IAuthenticationArgs | any) => {

    //console.log ("route: ",props );

    const componentProps: IInfrastructure & IComponent = {
        infrastructureType: Types.INFRASTRUCTURE_TYPE_COMPONENT,
        instanceType: AUTHENTICATION_INSTANCE_TYPE,
        instanceId: undefined, // authentications cannot be found programmatically?!
    };

    /*
    const authenticationProps: IAuthenticationProps = {
        middlewares: getChildrenArray(props.children).filter(child => isMiddleware(child)),
        webapps: getChildrenArray(props.children).filter(child => isWebApp(child)),
    }*/

    /**
     * The data-layer replaces the authentication component with its children
     */
    const mappedChildren = {
        // we provide the middlewares that we require
        children: [
            
            // we need to use cookies in order to verify whether a user is logged in
            createMiddleware({ callback: cookiesMiddleware() }),

            // the authentication check and redirect is done in the securedroute!


        ].concat(
            getChildrenArray(props).map(child => {

                if (isWebApp(child)) {

                    const wa_res = Object.assign({}, child, {
                        
                        routes: child.routes.map(grandchild => {

                            if (isSecuredRoute(grandchild)) {

                                const result = Object.assign({}, grandchild, {
                                    middlewares: [
                                        // this middleware checks whether the user is logged in
                                        createMiddleware({ callback: createAuthMiddleware(process.env[props.provider+SUFFIX_SECRET])}),

                                        // this middleware checks redirects the user to the login page, if she is not logged in
                                        createMiddleware({ callback: createRequestLoginMiddleware(props.clientId, props.callbackUrl, props.provider)})

                                    ].concat(grandchild.middlewares),

                                    // now that we have added the authentication middlewares, the route can be handled as a normal one
                                    instanceType: ROUTE_INSTANCE_TYPE,
                                })


                                console.log("found secured route! ", result);

                                return result;


                            }

                            return grandchild;


                        })
                    });

                    console.log("wa_res: ", wa_res.routes.map(c=> c.middlewares))

                    return wa_res;


                }

                // other children
                return child;

            })
        )
    };

    console.log("mapped children: ", mappedChildren.children.filter(c=> isWebApp(c)).map(c=> c.routes.map(r=>r.middlewares)));
    
    return Object.assign(props, componentProps, mappedChildren);


};

export const isAuthentication = (component) => {

    return component !== undefined &&
        component.instanceType === AUTHENTICATION_INSTANCE_TYPE;
};