
declare var require: any;
import React, { useEffect } from 'react';
//import Cookies from 'universal-cookie';
//import {IC_USER_ID} from "../authentication/auth-middleware";


//import ExecutionEnvironment from 'exenv';
//import {withRequest} from "../components/attach-request";

/*
export const isLoggedIn = (identityKey) => {
    const val = new Cookies().get(identityKey);
    //console.log("forceLogin: ",val);
    return val !== undefined;
}*/

// create a context with the default value: empty
//const LoggedInContext = React.createContext(undefined);


interface ForceLoginProps {
    userId: string | undefined,
    children: any,
    //request? : any // passed by `withRequest`
    //identityKey: string // the primaryKey-property of the applicable <Identity />-Component
}
/**
 * implements [[RequireServerRenderingSpec]]
 * 
 * the ForceLogin Component is a HOC that passes the userid to its child components
 * the forceLogin gets the cookie value regardless on whether it runs on the server or in the browser
 * see: https://www.npmjs.com/package/universal-cookie
 *
 * see hocs with context: https://itnext.io/combining-hocs-with-the-new-reacts-context-api-9d3617dccf0b
 *
 * how to check whether running on server or in browser: https://www.npmjs.com/package/exenv
 */
const ForceLogin = (props: ForceLoginProps) => {


    /**
     * When we run in the browser: if not logged in, then make the page reload from the server to
     * make the login-middlewares apply
     */
    useEffect(()=> {
        //console.log("ForceLogin-Component: ", this.props.identityKey)

        if (props.userId == undefined) {
            window.location.reload();
        }
        
    });


    //console.log("ForceLogin: request ->", this.props.request)

    // we provide the information which user is logged in
    return <div>{props.children}</div>

}

import {withUser} from "./attach-user";


/**
 * we MUST NOT IMPORT CONTEXTs directly, but require them at time of use generally from Infrastructure-Components
 * because this then resolves to node_modules
 */
export default withUser(ForceLogin);




