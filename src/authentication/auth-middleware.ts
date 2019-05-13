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
