
declare var require: any;
import * as React from 'react';
import {IC_USER_ID, IC_WEB_TOKEN} from "../authentication/auth-middleware";

import ExecutionEnvironment from 'exenv';
import Cookies from 'universal-cookie';

import {getBasename} from "../libs/iso-libs";


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

    console.log("attaching user: ", getUserId(undefined));

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

export function userLogout(pathUrl: string | undefined ) {
    const path = require('path');

    const cookies = new Cookies();
    cookies.remove(IC_USER_ID, { path: '/' });
    cookies.remove(IC_WEB_TOKEN, { path: '/' });

    if (pathUrl !== undefined) {
        window.location.href = path.join(getBasename(), pathUrl);
    } else {
        window.location.reload()
    }

}

export default require("infrastructure-components").withRequest(AttachUser);