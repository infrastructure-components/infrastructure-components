
declare var require: any;
import * as React from 'react';
import {IC_USER_ID} from "../authentication/auth-middleware";

import ExecutionEnvironment from 'exenv';
import Cookies from 'universal-cookie';

// create empty context as default
const UserContext = React.createContext({});



export function getUserId(request) {
    if (request) {
        return new Cookies(request.headers.cookie).get(IC_USER_ID)
    } else if (ExecutionEnvironment.canUseDOM) {
        return new Cookies().get(IC_USER_ID)
    }

    return undefined;

}

interface IAttachUserProps {
    request: any // passed by `withRequest`
}
/**
 * This HOC attaches the User-Id to a webapp, may be undefined!
 */
const AttachUser: React.SFC<IAttachUserProps> = (props) => {



    return <UserContext.Provider
        value={{
            userId: ExecutionEnvironment.canUseDOM ?
                new Cookies().get(IC_USER_ID) :
                new Cookies(props.request.headers.cookie).get(IC_USER_ID)
        }}>{props.children}</UserContext.Provider>

};

/**
 * @param Component
 * @returns {function(any): any}
 */
export function withUser(Component) {
    return function WrapperComponent(props) {
        return (
            <UserContext.Consumer>
                {(context: any) => {

                    return <Component
                        {...props}
                        userId={context.userId}
                    />
                }}
            </UserContext.Consumer>
        );
    };
}

import {withRequest} from "../components/attach-request";

export default withRequest(AttachUser);