declare var require: any;
import * as React from 'react';
import Cookies from 'universal-cookie';

import ExecutionEnvironment from 'exenv';
//import {withRequest} from "../components/attach-request";


export const isLoggedIn = (identityKey) => {
    const val = new Cookies().get(identityKey);
    //console.log("forceLogin: ",val);
    return val !== undefined;
}

// create a context with the default value: empty
const LoggedInContext = React.createContext(undefined);


interface ForceLoginProps {
    request? : any // passed by `withRequest`
    identityKey: string // the primaryKey-property of the applicable <Identity />-Component
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
class ForceLogin extends React.Component<ForceLoginProps, {}> {




    /**
     * When we run in the browser: if not logged in, then make the page reload from the server to
     * make the login-middlewares apply
     */
    componentDidMount() {
        console.log("ForceLogin-Component: ", this.props.identityKey)

        if (!isLoggedIn(this.props.identityKey)) {
            window.location.reload();
        }
        
    }


    render () {
        
        console.log("ForceLogin: request ->", this.props.request)

        // we provide the information which user is logged in
        return <LoggedInContext.Provider value={
            ExecutionEnvironment.canUseDOM ?
                new Cookies().get(this.props.identityKey) :
                new Cookies(this.props.request.headers.cookie).get(this.props.identityKey)
                
        }>{this.props.children}</LoggedInContext.Provider>

    }
}

/**
 * Pass the information on whether the user `isLoggedIn` as prop to the component
 * @param Component
 * @returns {function(any): any}
 */
export function withUserId(Component) {
    return function WrapperComponent(props) {
        return (
            <LoggedInContext.Consumer>
                {value => <Component {...props} userId={value} />}
            </LoggedInContext.Consumer>
        );
    };
}

/**
 * we MUST NOT IMPORT CONTEXTs directly, but require them at time of use generally from Infrastructure-Components
 * because this then resolves to node_modules
 */
export default require("infrastructure-components").withRequest(ForceLogin);




