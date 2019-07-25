import React, {ReactNode} from 'react';

import {IComponent} from "../types/component";
import Types, { IInfrastructure } from "../types";

import createMiddleware, { isMiddleware } from '../middleware/middleware-component';
import createWebApp, { isWebApp } from '../webapp/webapp-component';
import { isSecuredRoute } from './securedroute-component';
import { isSecuredEntry } from './securedentry-component';
import createRoute, { ROUTE_INSTANCE_TYPE } from '../route/route-component';
import { getChildrenArray, findComponentRecursively } from '../libs';
import {
    createAuthMiddleware, createCallbackMiddleware, IUserData, EMAIL_CONFIRMATION_PARAM, EMAIL_PARAM, PASSWORD_PARAM,
    AUTH_STATUS
} from "./auth-middleware";

import bodyParser from 'body-parser';
import {isSecuredService} from "./securedservice-component";
import {SERVICE_INSTANCE_TYPE} from "../service/service-component";

export const AUTHENTICATION_INSTANCE_TYPE = "AuthenticationComponent";


export const AuthenticationProvider = {
    EMAIL: "AUTH_EMAIL",
    
    GITHUB: "AUTH_GITHUB",

    // TODO Medium Auth only partly implemented!!!
    MEDIUM: "AUTH_MEDIUM"
};

export const AUTH_RESPONSE = {
    EMAIL_INVALID: "EMAIL_INVALID", // the e-mail format is invalid
    NOT_IMPLEMENTED: "NOT_IMPLEMENTED" // the authCallback is not implemented for this provider
};

export const getProviderKey = (provider) => {
    return provider+SUFFIX_SECRET;
}

export const getClientSecret = (provider) => {
    return process.env[getProviderKey(provider)];
}

/**
 * This creates a customized middleware that catches an error when the user is not logged in, i.e. it forwards her
 * to the provider's login-page
 *
 * @param clientId as defined in the app of the provider
 * @param callbackUrl as defined in the app of the provider
 * @param provider to create the redirect Url for
 */
export const createRequestLoginMiddleware = (clientId: string, callbackUrl: string, provider: string, loginUrl: string) => (err, req, res, next) => {

    if (provider === AuthenticationProvider.EMAIL) {
        console.log("request login from: ", loginUrl);
        res.redirect(`${loginUrl}?page=${req.url}`);
    } else if (provider === AuthenticationProvider.GITHUB) {
        res.redirect(`https://github.com/login/oauth/authorize?scope=user:email&client_id=${clientId}&redirect_uri=${callbackUrl}?page=${req.url}`);
    } else if (provider === AuthenticationProvider.MEDIUM) {
        res.redirect(`https://medium.com/m/oauth/authorize?client_id=${clientId}&scope=basicProfile,listPublications,publishPost&state=InteractiveMedium&response_type=code&redirect_uri=${callbackUrl}?page=${req.url}`);
    }

    return;

};

/**
 * Create a function that creates a function that fetches the AccessToken of the provider
 */
export const createFetchAccessTokenFunction = (
    clientId: string,
    callbackUrl: string,
    provider: string,
    senderEmail?: string,
    getSubject?: (recipient: string) => string,
    getHtmlText?: (recipient: string, url: string) => string,
) => (req: any) => {

    if (provider === AuthenticationProvider.EMAIL) {

        console.log("this is the EMAIL - createFetchAccessTokenFunction middleware");

        const { email, password, page } = req.query;
        
        if (email !== undefined && password !== undefined) {
            
            // the function fFetch must call a service that responds with a json. this json is fed into createGetUserFunction
            return {
                redirectPage: page,
                fFetch: async function () {

                    const uuidv4 = require('uuid/v4');
                    const access_token = uuidv4();
                    
                    // TODO: here we call the service to send an email to the user
                    // see: https://docs.aws.amazon.com/de_de/sdk-for-javascript/v2/developer-guide/ses-examples-sending-email.html
                    const AWS = require('aws-sdk');


                    // Create sendEmail params
                    var params = {
                        Destination: { /* required */
                            BccAddresses: [
                                senderEmail
                            ],
                            CcAddresses: [
                            ],
                            ToAddresses: [
                                email
                            ]
                        },
                        Message: { /* required */
                            Body: { /* required */
                                Html: {
                                    Charset: "UTF-8",
                                    Data: getHtmlText(email,
                                        `${callbackUrl}?${EMAIL_CONFIRMATION_PARAM}=${access_token}&${EMAIL_PARAM}=${email}`)
                                },
                                /*Text: {
                                    Charset: "UTF-8",
                                    Data: "TEXT_FORMAT_BODY"
                                }*/
                            },
                            Subject: {
                                Charset: 'UTF-8',
                                Data: getSubject(email)
                            }
                        },
                        Source: senderEmail, /* required */
                        ReplyToAddresses: [
                            senderEmail
                        ],
                    };

                    console.log("this is the fFetch of the mail-authentication");
                    // this is the response
                    return new Promise(function(resolve, reject) {

                        // Create the promise and SES service object
                        var sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();

                        // Handle promise's fulfilled/rejected states
                        sendPromise.then(
                            function(data) {
                                console.log(data.MessageId);

                                resolve({
                                    id: email, // we take the email - that should be unique
                                    name: "",
                                    username: "",
                                    imageUrl:"",
                                    access_token: access_token,
                                    email: email,
                                    encrypted_password: password,
                                    status: AUTH_STATUS.PENDING
                                })
                            }).catch(
                            function(err) {
                                console.error(err, err.stack);
                                reject(err);
                            });


                    });
                }/*fetch(callbackUrl,{
                    method: 'POST',
                    body: `code=${code}&client_id=${clientId}&client_secret=${getClientSecret(provider)}&grant_type=authorization_code&redirect_uri=${callbackUrl}`,
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Accept": "application/json",
                        "Accept-Charset": "utf-8"
                    }
                })*/
            }
        }



    } else if (provider === AuthenticationProvider.GITHUB) {

        // TODO check https://octokit.github.io/rest.js/ !!!
        // see docs: https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/

        //console.log("request: ", req);


        const { state, code, error, page } = req.query;
        // session_code = request.env['rack.request.query_hash']['code']

        if (error !== undefined) {
            // TODO handle an error, e.g. user does not authorize the app

            console.log(error);

            return;

        } else if (code !== undefined) {

            console.log("found redirect page: ", page)

            return {
                redirectPage: page,
                fFetch: async function () {
                    return await fetch('https://github.com/login/oauth/access_token',{
                        method: 'POST',
                        body: `code=${code}&client_id=${clientId}&client_secret=${getClientSecret(provider)}`,
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                            "Accept": "application/json",
                            "Accept-Charset": "utf-8"
                        }
                    }).then(function(response) {
                        return response.json();
                    })
                }
            }

        };


    } else if (provider === AuthenticationProvider.MEDIUM) {

        const { state, code, error, page } = req.query;
        if (error !== undefined) {
            // TODO handle an error, e.g. user does not authorize the app

            console.log(error);

            return;

        } else if (code !== undefined) {
            return {
                redirectPage: page,
                fFetch: fetch('https://api.medium.com/v1/tokens',{
                    method: 'POST',
                    body: `code=${code}&client_id=${clientId}&client_secret=${getClientSecret(provider)}&grant_type=authorization_code&redirect_uri=${callbackUrl}`,
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Accept": "application/json",
                        "Accept-Charset": "utf-8"
                    }
                }).then(function(response) {
                    return response.json();
                })
            }
        }

    }





};

export const createGetUserFunction = (provider: string) => async function (resJson: any): Promise<IUserData> {

    console.log("resJson: ", resJson);

    if (provider === AuthenticationProvider.EMAIL) {

        // we just provide the response-json
        return new Promise(function(resolve, reject) {

            resolve(resJson)
        });
        
    } else if (provider === AuthenticationProvider.GITHUB) {
        const { token_type, access_token, /*refresh_token, scope, expires_at */ } = resJson;

        // try the freshly acquired token and get the user's Medium.com id
        return await fetch('https://api.github.com/user',{
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Accept-Charset": "utf-8",
                "Authorization": token_type+" "+access_token
            }
        }).then(function(response) {

            // now parse the json
            return response.json();

        }).then(function(data){

            /*
                "login":"frankzickert",
                "id":10414265,
                "node_id":"MDQ6VXNlcjEwNDE0MjY1",
                "avatar_url":"https://avatars0.githubusercontent.com/u/10414265?v=4",
                "gravatar_id":"",
                "url":"https://api.github.com/users/frankzickert",
                "html_url":"https://github.com/frankzickert",
                "followers_url":"https://api.github.com/users/frankzickert/followers",
                "following_url":"https://api.github.com/users/frankzickert/following{/other_user}",
                "gists_url":"https://api.github.com/users/frankzickert/gists{/gist_id}",
                "starred_url":"https://api.github.com/users/frankzickert/starred{/owner}{/repo}",
                "subscriptions_url":"https://api.github.com/users/frankzickert/subscriptions",
                "organizations_url":"https://api.github.com/users/frankzickert/orgs",
                "repos_url":"https://api.github.com/users/frankzickert/repos",
                "events_url":"https://api.github.com/users/frankzickert/events{/privacy}",
                "received_events_url":"https://api.github.com/users/frankzickert/received_events",
                "type":"User",
                "site_admin":false,
                "name":"Frank Zickert",
                "company":null,
                "blog":"https://www.lean-data-science.com/",
                "location":"Germany",
                "email":"frank.zickert@lean-data-science.awsapps.com",
                "hireable":null,
                "bio":"I have been working as an IT professional for 15 years...",
                "public_repos":3,
                "public_gists":5,
                "followers":1,
                "following":0,
                "created_at":"2015-01-06T07:23:33Z",
                "updated_at":"2019-05-08T20:37:43Z"}
             */

            return {
                id: data.id,
                name: data.name,
                username: data.login,
                imageUrl: data.avatar_url,
                email: data.email,
                access_token: access_token,
                status: AUTH_STATUS.ACTIVE
            }

        });



    } else if (provider === AuthenticationProvider.MEDIUM) {
        const { token_type, access_token, refresh_token, scope, expires_at } = resJson;

        // try the freshly acquired token and get the user's Medium.com id
        return await fetch('https://api.medium.com/v1/me',{
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Accept-Charset": "utf-8",
                "Authorization": token_type+" "+access_token
            }
        }).then(function(response) {

            // now parse the json
            return response.json();

        }).then(function(data){

            return {
                id: data.id,
                name: data.name,
                username: data.username,
                imageUrl: data.imageUrl,
                email: data.email,
                access_token: access_token,
                status: AUTH_STATUS.ACTIVE
            }
            
        });


    }




}

/**
 * suffix to the provider. specifies the -env-variable to hold the clientSecret
 */
const SUFFIX_SECRET = "_SECRET"

/**
 * Specifies all the properties that a Authentication-Component must have
 */
export interface IAuthenticationArgs {

    /**
     * a unique id or name of the datalayer
     */
    id: string,

    /**
     * The provider must be a string of AuthenticationProvider
     */
    provider: string,

    /**
     * The clientID provided by the Provider, e.g. from Github
     */
    clientId?: string,

    /**
     * a fully qualified url, as specified in the setup of the auth-provider
     */
    callbackUrl: string,


    /**
     * An url to redirect in order to request the user to login, used by the email authentication
     */
    loginUrl: string,

    /**
     * The email address we use to send the confirmation request email. This email address must be verified in
     * AWS Simple Email Service (SES)
     */
    senderEmail?: string,

    /**
     * callback to provide the subject of the confirmation email
     * @param recipient
     */
    getSubject: (recipient: string) => string,

    /**
     * callback to provide the text (in html) of the confirmation email
     * @param recipient
     * @param url
     */
    getHtmlText: (recipient: string, url: string) => string,

}


/**
 * specifies the properties that an Authentication-Component has during runtime
 */
export interface IAuthenticationProps {

    setStoreIdentityData: (
        storeIdentityData: (request: any, key: string, val: any, jsonData: any) => void
    ) => void,

    storeAuthData?: (request: any, key: string, val: any, jsonData: any) => void,

    setGetIdentityData: (getIdentityData: (request: any, matchBrowserIdentity: boolean, key: string, val: any) => any) => void,

    getAuthData?: (request: any, matchBrowserIdentity: boolean, key: string, val: any) => any,

    /**
     *
     * @param triggerRedirect function that triggers a redirect, that we can call with an argument
     */
    authCallback: (email: string, password: string, page: string, onResponse: (code:string)=> void) => void
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
        instanceId: props.id,
    };



    const authenticationProps: IAuthenticationProps = {

        // set our storeData-Property
        setStoreIdentityData: (storeIdentityData: (request: any, key: string, val: any, jsonData: any) => void) => {
            //console.log("setStoreIdentityData: ", storeIdentityData);
            props.storeAuthData = storeIdentityData;

            //console.log("auth-props: ", props)
        },

        setGetIdentityData: (getIdentityData: (request: any, matchBrowserIdentity: boolean, key: string, val: any) => any ) => {
            props.getAuthData = getIdentityData;
        },

        authCallback: (email: string, password: string, page: string, onResponse: (code:string) => void) => {
            console.log("this is the auth-Callback");

            if (props.provider === AuthenticationProvider.EMAIL) {
                // verify the format of the e-mail address
                if (!(/^([A-Za-z0-9_\-.])+@([A-Za-z0-9_\-.])+\.([A-Za-z]{2,})$/.test(email))) {
                    onResponse(AUTH_RESPONSE.EMAIL_INVALID);
                    return;
                }

                // redirect to the provided url that is
                // TODO encrypt the password!
                window.location.href = `${props.callbackUrl}?${EMAIL_PARAM}=${email}&${PASSWORD_PARAM}=${password}&page=${page}`;
                return;
            }


            onResponse(AUTH_RESPONSE.NOT_IMPLEMENTED);

        }

    };

    /**
     * For this function is a callback on a middleware, it only sets the userId on the backend side!
     * @param userid
     */
    const onAuthenticated = (userid:string): void => {
        console.log("just authenticated, tell the securedEntries about it")
        // we need to provide some data to the secured entries
        findComponentRecursively(props.children, (c) => c.setUserId !== undefined).forEach( se => {
            //console.log("found secured entry: ", se);
            se.setUserId(userid)
            
        });
    };

    findComponentRecursively(props.children, (c) => c.setMiddleware !== undefined).forEach( se => {
        //console.log("found secured entry: ", se);
        se.setMiddleware(createMiddleware({ callback:createAuthMiddleware(getClientSecret(props.provider), onAuthenticated)}))

    });
    
    // we need to provide some data to the secured routes
    findComponentRecursively(props.children, isSecuredRoute).forEach( sr => {
        //console.log("found secured route: ", sr);

        sr.middlewares = [
            // this middleware checks whether the user is logged in
            createMiddleware({ callback: createAuthMiddleware(getClientSecret(props.provider), onAuthenticated)}),

            // this middleware checks redirects the user to the login page, if she is not logged in
            createMiddleware({ callback: createRequestLoginMiddleware(props.clientId, props.callbackUrl, props.provider, props.loginUrl)})

        ].concat(sr.middlewares);

        // now that we have added the authentication middlewares, the route can be handled as a normal one
        sr.instanceType = ROUTE_INSTANCE_TYPE;

    });

    // we need to provide some data to the secured routes
    findComponentRecursively(props.children, isSecuredService).forEach( service => {
        //console.log("found secured route: ", sr);

        service.middlewares = [
            // this middleware checks whether the user is logged in
            createMiddleware({ callback: createAuthMiddleware(getClientSecret(props.provider), onAuthenticated)}),

            // this middleware checks redirects the user to the login page, if she is not logged in
            createMiddleware({ callback: createRequestLoginMiddleware(props.clientId, props.callbackUrl, props.provider, props.loginUrl)})

        ].concat(service.middlewares);

        // now that we have added the authentication middlewares, the route can be handled as a normal one
        service.instanceType = SERVICE_INSTANCE_TYPE;

    });


    // we need to provide the AuthenticationId to webApps, these may be anywhere in the tree, not
    // only direct children. So rather than mapping the children, we need to change them
    findComponentRecursively(props.children, (child) => child.setAuthenticationId !== undefined).forEach( child => {
        child.setAuthenticationId(props.id)
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

                    // middleware required of parsing the json response
                    createMiddleware({ callback: bodyParser.json() }),
                    createMiddleware({ callback: bodyParser.urlencoded({
                        extended: true
                    }) }),

                    createMiddleware({ callback: createCallbackMiddleware(
                        getClientSecret(props.provider),
                        createFetchAccessTokenFunction(
                            props.clientId,
                            props.callbackUrl,
                            props.provider,
                            props.senderEmail,
                            props.getSubject,
                            props.getHtmlText

                        ), //fetchAccessToken
                        createGetUserFunction(props.provider),
                        async function (request: any, key: string, val: any, jsonData: any) {
                            return await props.storeAuthData(request, key, val, jsonData)
                        },//props.storeAuthData
                        async function (request: any, matchBrowserIdentity: boolean, key: string, val: any) {
                            return await props.getAuthData(request, matchBrowserIdentity, key, val)
                        } //getAuthData
                        
                    )}),

                    // the render function should never be called for the Callback-Middleware redirects to the
                    // page that was requested in the first request
                    createRoute({
                        path: props.callbackUrl.substring(props.callbackUrl.lastIndexOf("/")),
                        name: "WEBAPP_"+props.provider,
                        render: (rp) => <div>This is the callback route!</div>,
                    })

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