/**
 * Created by frank.zickert on 28.02.19.
 */
declare var require: any;


import jwt from 'jsonwebtoken';

/**
 * token handed over to the user's browser, serves as password to encrypt/decrypt the Medium-access token
 * @type {string}
 */
const IC_WEB_TOKEN = "IC_WEB_TOKEN";

/**
 * unique id of the user in Medium.com
 * @type {string}
 */
const IC_USER_ID = 'IC_USER_ID';



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
export const createAuthMiddleware = (clientSecret) => (req, res, next) => {

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

                if (id === userId) {
                    // the token contains the correct id
                    console.log("token matches :-)")
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


/**
 * Use this middleware at the endpoint that is specified as the callback-url.
 *
 * @param clientId
 * @param clientSecret
 * @param callbackUrl
 * @returns {any}
 */
export const createCallbackMiddleware = (
    clientId, clientSecret, callbackUrl, storeAuthData: (request: any, key: string, val: any, jsonData: any) => void
) => async function (req, res, next) {

    console.log("THIS IS THE CALLBACK")
    //console.log(req.universalCookies)

    const { state, code, error } = req.query;
    if (error !== undefined) {
        // TODO handle an error, e.g. user does not authorize the app

        console.log(error);


    } else if (code !== undefined) {

        console.log("code: ", code);

        await fetch('https://api.medium.com/v1/tokens',{
            method: 'POST',
            body: `code=${code}&client_id=${clientId}&client_secret=${clientSecret}&grant_type=authorization_code&redirect_uri=${callbackUrl}`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
                "Accept-Charset": "utf-8"
            }
        }).then(function(response) {
            return response.json();
        }).then(async function(resJson) {

            const { token_type, access_token, refresh_token, scope, expires_at } = resJson;

            // try the freshly acquired token and get the user's Medium.com id
            await fetch('https://api.medium.com/v1/me',{
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Accept-Charset": "utf-8",
                    "Authorization": token_type+" "+access_token
                }
            }).then(function(response) {
                return response.json();
            }).then(function(dataJson) {
                console.log(JSON.stringify(dataJson));

                const {id, name, username, url, imageUrl } = dataJson.data;

                console.log("id: ", id);
                console.log("name: ", name);

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

                // put the encrypted web token into the database, this is user (browser)-specific data!
                storeAuthData(
                    req, // request: any
                    IC_USER_ID, // key: string
                    id, //val: any,
                    {
                        encryptedAccessToken: encryptedAccessToken
                    } //jsonData: any
                );

                // give the webtoken to back to the user
                req.universalCookies.set(IC_WEB_TOKEN, webtoken);
                req.universalCookies.set(IC_USER_ID, id);

                //res.redirect('http://' + req.headers.host + getBasename()+"/");
                return;
            });

        });

    }
    return next();

}