import React, {ReactNode} from 'react';

import {IComponent} from "../types/component";
import Types, { IInfrastructure } from "../types";

import createMiddleware, { isMiddleware } from '../middleware/middleware-component';
import createWebApp, { isWebApp } from '../webapp/webapp-component';
import { isSecuredRoute } from './securedroute-component';
import { ROUTE_INSTANCE_TYPE } from '../route/route-component';
import { getChildrenArray, findComponentRecursively } from '../libs';
import {createAuthMiddleware, createCallbackMiddleware } from "./auth-middleware";

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

    setStoreIdentityData: (
        storeIdentityData: (request: any, key: string, val: any, jsonData: any) => void
    ) => void,

    storeAuthData?: (request: any, key: string, val: any, jsonData: any) => void

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


    // set our storeData-Property
    const authenticationProps: IAuthenticationProps = {
        setStoreIdentityData: (storeIdentityData: (request: any, key: string, val: any, jsonData: any) => void) => {
            props.storeAuthData = storeIdentityData;
        }

    };

    // we need to provide some data to the secured routes
    findComponentRecursively(props.children, isSecuredRoute).forEach( sr => {
        console.log("found secured route: ", sr);

        sr.middlewares = [
            // this middleware checks whether the user is logged in
            createMiddleware({ callback: createAuthMiddleware(process.env[props.provider+SUFFIX_SECRET])}),

            // this middleware checks redirects the user to the login page, if she is not logged in
            createMiddleware({ callback: createRequestLoginMiddleware(props.clientId, props.callbackUrl, props.provider)})

        ].concat(sr.middlewares);

        // now that we have added the authentication middlewares, the route can be handled as a normal one
        sr.instanceType =  ROUTE_INSTANCE_TYPE;
    });


    /**
     * The data-layer replaces the authentication component with its children
     */
    const mappedChildren = {
        // we provide the middlewares that we require
        children: [

            // we create a webapp to handle the callback
            createWebApp({
                id: "WEBAPP_"+props.provider,
                path: props.callbackUrl.substring(props.callbackUrl.lastIndexOf("/")),
                method: "GET",
                children: [
                    createCallbackMiddleware(
                        props.clientId,
                        process.env[props.provider+SUFFIX_SECRET],
                        props.callbackUrl,
                        props.storeAuthData
                    ),

                ]
            })

            //,
            //(browserId: string) => redirectMiddleware("/dashboard")

        ].concat(getChildrenArray(props.children))
    };

    console.log("authentication: ", findComponentRecursively(props.children, isWebApp));
    return Object.assign(props, componentProps, authenticationProps, mappedChildren);
    
};

export const isAuthentication = (component) => {

    return component !== undefined &&
        component.instanceType === AUTHENTICATION_INSTANCE_TYPE;
};