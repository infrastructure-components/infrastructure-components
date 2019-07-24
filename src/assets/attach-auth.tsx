declare var require: any;
import * as React from 'react';

import Types from '../types';
import { extractObject } from '../libs/loader';

// create empty context as default
const AuthContext = React.createContext({});



interface IAttachAuthProps {
    authCallback: any, // the callback function to call once the user entered her credentials
    children: any
}
/**
 * This HOC attaches the User-Id to a webapp, may be undefined!
 */
const AttachAuth= (props: IAttachAuthProps) => {

    //console.log("attach auth: ", props.authCallback);

    return <AuthContext.Provider
        value={{
            authCallback: props.authCallback
        }}>{props.children}</AuthContext.Provider>

};

/**
 * @param Component
 * @returns {function(any): any}
 */
export function withAuthCallback(Component) {
    return function WrapperComponent(props) {
        return (
            <AuthContext.Consumer>
                {(context: any) => {

                    return <Component
                        {...props}
                        authCallback={context.authCallback}
                    />
                }}
            </AuthContext.Consumer>
        );
    };
}

export const getAuthCallback = (isoConfig, authenticationId) => {
    const authComp = extractObject(
        isoConfig,
        Types.INFRASTRUCTURE_TYPE_COMPONENT,
        authenticationId
    );


    const authCallback = authComp !== undefined ? authComp.authCallback : (triggerRedirect) => {
        console.log("this is the dummy auth callback");
        return undefined;
    }

    //console.log("getAuthCallback: ", authCallback)

    return authCallback;
}

export default AttachAuth;