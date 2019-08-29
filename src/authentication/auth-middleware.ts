/**
 * Created by frank.zickert on 28.02.19.
 */
declare var require: any;


import jwt from 'jsonwebtoken';

import {getBasename} from '../libs/iso-libs';
/**
 * token handed over to the user's browser, serves as password to encrypt/decrypt the Medium-access token
 * @type {string}
 */
export const IC_WEB_TOKEN = "IC_WEB_TOKEN";

/**
 * unique id of the user, comes from the provider (GitHub, Medium, etc)
 * @type {string}
 */
export const IC_USER_ID = 'IC_USER_ID';

export const EMAIL_CONFIRMATION_PARAM = "confirmationtoken";
export const EMAIL_PARAM = "email";
export const PASSWORD_PARAM = "password";

export const AUTH_STATUS = {
    PENDING: "pending", // the authentication is pending, e.g. e-mail waitung for the confirmation
    ACTIVE: "active" // the authentication is active
}


/**
 * This is an Express middleware that checks whether there is a cookie in the header that contains valid login
 * data
 *
 * @param req
 * @param res
 * @param next
 * @returns if successful, it calls the next middleware, if not, it throws an exception that causes the
 * next error handler to be called
 */
export const createAuthMiddleware = (clientSecret, onAuthenticated: (userid:string) => void) => (req, res, next) => {

    console.log("createAuthMiddleware", req.universalCookies);

    const webtoken = req.universalCookies.get(IC_WEB_TOKEN);
    const userId = req.universalCookies.get(IC_USER_ID);

    if (webtoken !== undefined && userId !== undefined) {
        console.log("webtoken: ", webtoken);
        console.log("userId: ", userId);

        try {
            const decoded = jwt.verify(webtoken, clientSecret);
            if (decoded !== undefined) {

                const { id } = decoded;

                console.log("id: ", id);

                // we might have numbers... then the "===" comparison does not work
                if (id.toString() === userId.toString()) {
                    // the token contains the correct id
                    console.log("token matches :-)")
                    onAuthenticated(id.toString());
                    return next();
                }

            }
            return next("UserId in Token does not match UserId in cookie");
            //throw new Error("UserId in Token does not match UserId in cookie");
        } catch(err) {
            return next(err);
            //throw new Error(err);
        }

    } else {
        return next('No token present!');
        //throw new Error('No token present!');
    }


    

};

export interface IUserData {
    id: string | undefined,
    name: string | undefined,
    username: string | undefined,
    imageUrl: string | undefined,
    email: string | undefined,
    access_token: string | undefined,
    encrypted_password?: string,
    status?: string
}

const getEncryptedAccessToken = (id, clientSecret, access_token) => {

    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + 60);

    // we use the clientSecret to sign the webtoken
    const webtoken = jwt.sign({
        id: id,
        exp: expirationDate.getTime() / 1000,
    }, clientSecret);

    // now let's use the webtoken to encrypt the access token
    const encryptedAccessToken = jwt.sign({
        id: id,
        accessToken: access_token,
        exp: expirationDate.getTime() / 1000,
    }, webtoken);

    return {
        webtoken: webtoken,
        encryptedAccessToken: encryptedAccessToken
    };
};

/**
 * Use this middleware at the endpoint that is specified as the callback-url.
 *
 * @param fetchAccessToken function that can be called to fetch the access Token
 * @param getUserData function to get the userData, takes as input the response from the accessToken-request
 * @param clientSecret
 * @param callbackUrl
 * @param storeAuthData
 * @returns {any}
 */
export const createCallbackMiddleware = (
    clientSecret,
    fetchAccessToken: (req: any) => any,
    getUserData: (resJson: any) => Promise<IUserData>,
    storeAuthData: (request: any, key: string, val: any, jsonData: any) => void,
    getAuthData: (request: any, matchBrowserIdentity: boolean, key: string, val: any) => any
) => async function (req, res, next) {

    const path = require('path');

    console.log("THIS IS THE AUTH CALLBACK");

    
    // we use this middleware also as endpoint for email confirmation, then the token-parameter must be specified
    const email_confirmation = req.query[EMAIL_CONFIRMATION_PARAM];
    const email_param = req.query[EMAIL_PARAM];
    const password_param = req.query[PASSWORD_PARAM];
    const page = req.query["page"];

    console.log("received params: ", email_confirmation, email_param, password_param);

    if (email_param) {
        // get the entry of the database

        const authDataList = await getAuthData(
            req, // request: any
            false, //matchBrowserIdentity -- we do not want to match the browser identity, the user might use another browser to confirm he mail address
            IC_USER_ID, // key: string
            email_param//val: any,
        );

        console.log("retrieved auth-data-list: ", authDataList);

        // check whether the user already exists
        const parsedAuthDataList = authDataList.map(raw=> JSON.parse(raw.jsonData));

        // the user logs in with her email and password
        if (password_param !== undefined && parsedAuthDataList.length > 0) {

            const authData = parsedAuthDataList
                .reduce((result, cur) => result !== undefined ? result : (
                    // check whether the password is correct
                    cur.encrypted_password === password_param ? cur: undefined
                ), undefined);

            if (authData !== undefined) {

                // create a new webtoken, i.e. other browser will be logged out!
                const { webtoken, encryptedAccessToken } = getEncryptedAccessToken(email_param, clientSecret, password_param);

                // put the encrypted web token into the database, this is user (browser)-specific data!
                const storeResult = await storeAuthData(
                    req, // request: any
                    IC_USER_ID, // key: string
                    email_param, //val: any,
                    Object.assign({}, authData, {
                        encryptedAccessToken: encryptedAccessToken
                    })
                );


                req.universalCookies.set(IC_WEB_TOKEN, webtoken, { path: '/' });
                req.universalCookies.set(IC_USER_ID, email_param, { path: '/' });


                console.log("store password verified result: ", storeResult);

                res.redirect(`${path.join(getBasename(), page !== undefined ? page : "/")}?message=success`);


            } else {
                console.log ("could not verify password, ", password_param,email_param);
                return next("login failure");
            }

            return;

        } else if (email_confirmation && parsedAuthDataList.length > 0) {
            // the user clicks the link from within the confirmation email

            const authData = parsedAuthDataList
                .reduce((result, cur) => result !== undefined ? result : (
                    cur.encryptedAccessToken === email_confirmation ? cur: undefined
                ), undefined);

            console.log("retrieved auth-data: ", authData);

            if (authData !== undefined) {

                const { webtoken, encryptedAccessToken } = getEncryptedAccessToken(email_param, clientSecret, email_confirmation);


                // put the encrypted web token into the database, this is user (browser)-specific data!
                const storeResult = await storeAuthData(
                    req, // request: any
                    IC_USER_ID, // key: string
                    email_param, //val: any,
                    Object.assign({}, authData, {
                        status: AUTH_STATUS.ACTIVE,
                        encryptedAccessToken: encryptedAccessToken
                    })
                );

                console.log("webtoken: ", webtoken, email_param)

                req.universalCookies.set(IC_WEB_TOKEN, webtoken, { path: '/' });
                req.universalCookies.set(IC_USER_ID, email_param, { path: '/' });

                console.log("store email verified result: ", storeResult);

                res.redirect(`${path.join(getBasename(), page !== undefined ? page : "/")}?message=mailverified`);


            } else {
                console.log ("could not verify access token, ", email_confirmation,email_param);

                return next("access token is wrong");
            }
            return;
        }

    }

    const { redirectPage, fFetch } = fetchAccessToken(req);

    // store the redirectPage in the request for further processing
    console.log("redirect to: ", redirectPage);
    req["redirectPage"] = redirectPage;


    await fFetch().then(async function(resJson) {

        //const { token_type, access_token /*, refresh_token, scope, expires_at */} = resJson;

        // try the freshly acquired token and get the user's Medium.com id
        await getUserData(resJson).then(async function(data) {
            console.log("get user data: ", JSON.stringify(data));

            const {id, name, username, imageUrl, access_token, email, status } = data;

            console.log("id: ", id);
            console.log("name: ", name);

            const { webtoken, encryptedAccessToken } = getEncryptedAccessToken(id, clientSecret, access_token);

            //console.log("encryptedAccessToken: ", encryptedAccessToken);

            // TODO id may be undefined when the token expired!

            //console.log("storeAuthData: ", storeAuthData)

            // put the encrypted web token into the database, this is user (browser)-specific data!
            const storeResult = await storeAuthData(
                req, // request: any
                IC_USER_ID, // key: string
                id, //val: any,
                Object.assign({
                    /** We only store the encrypted token when we have an active status, i.e. a auth-provider
                     * we keep it in clear-text for e-mail  */
                    encryptedAccessToken: status === AUTH_STATUS.ACTIVE ? encryptedAccessToken : access_token,
                    name: name,
                    username: username,
                    imageUrl: imageUrl,
                    email: email,
                    status: status,

                }, password_param ? {
                    encrypted_password: password_param
                } : {}) //jsonData: any
            );

            console.log("storeResult: ", storeResult);


            // give the webtoken to back to the user - if the account is valid, only!
            if (status === AUTH_STATUS.ACTIVE) {
                req.universalCookies.set(IC_WEB_TOKEN, webtoken, { path: '/' });
                req.universalCookies.set(IC_USER_ID, id, { path: '/' });

            }


            console.log("done") //'http://' +path.join(req.headers.host +  +
            res.redirect(path.join(getBasename(), redirectPage));
            return;
        });

    });
    

};