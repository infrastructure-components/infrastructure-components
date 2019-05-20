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
const IC_WEB_TOKEN = "IC_WEB_TOKEN";

/**
 * unique id of the user, comes from the provider (GitHub, Medium, etc)
 * @type {string}
 */
export const IC_USER_ID = 'IC_USER_ID';



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
    id: string,
    name: string,
    username: string,
    imageUrl: string,
    email: string,
    access_token: string
}

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
    storeAuthData: (request: any, key: string, val: any, jsonData: any) => void
) => async function (req, res, next) {

    const path = require('path');

    console.log("THIS IS THE AUTH CALLBACK")

    const { redirectPage, fFetch } = fetchAccessToken(req);

    // store the redirectPage in the request for further processing
    console.log("redirect to: ", redirectPage);
    req["redirectPage"] = redirectPage;


    await fFetch().then(function(response) {
        return response.json();
    }).then(async function(resJson) {

        //const { token_type, access_token /*, refresh_token, scope, expires_at */} = resJson;

        // try the freshly acquired token and get the user's Medium.com id
        await getUserData(resJson).then(async function(data) {
            //console.log(JSON.stringify(dataJson));

            const {id, name, username, imageUrl, access_token } = data;

            //console.log("id: ", id);
            //console.log("name: ", name);

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

            //console.log("encryptedAccessToken: ", encryptedAccessToken);

            // TODO id may be undefined when the token expired!

            //console.log("storeAuthData: ", storeAuthData)

            // put the encrypted web token into the database, this is user (browser)-specific data!
            const storeResult = await storeAuthData(
                req, // request: any
                IC_USER_ID, // key: string
                id, //val: any,
                {
                    encryptedAccessToken: encryptedAccessToken
                } //jsonData: any
            );

            console.log("storeResult: ", storeResult);


            // give the webtoken to back to the user
            req.universalCookies.set(IC_WEB_TOKEN, webtoken);
            req.universalCookies.set(IC_USER_ID, id);

            console.log("done") //'http://' +path.join(req.headers.host +  +
            res.redirect(path.join(getBasename(), redirectPage));
            return;
        });

    });
    

}