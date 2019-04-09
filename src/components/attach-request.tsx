declare var require: any;
import * as React from 'react';

// create empty context as default
const RequestContext = React.createContext({});

interface AttachRequestProps {
    request?: any
}
/**
 * This HOC attaches the req sent to the server down to the Components - on server side only, of course!
 *
 * see hocs with context: https://itnext.io/combining-hocs-with-the-new-reacts-context-api-9d3617dccf0b
 *
 * When using the req: either check whether it is undefined or whether we run on the server -->
 * how to check whether running on server or in browser: https://www.npmjs.com/package/exenv
 */
const AttachRequest: React.SFC<AttachRequestProps> = (props) => {

    //console.log("attached request: " , props.request);
    return <RequestContext.Provider value={props.request}>{props.children}</RequestContext.Provider>


};

/**
 * Pass the information on whether the user `isLoggedIn` as prop to the component
 * @param Component
 * @returns {function(any): any}
 */
export function withRequest(Component) {


    return function WrapperComponent(props) {
        return (
            <RequestContext.Consumer>
                {value => {
                    //console.log("with request: ", value);
                    return <Component {...props} request={value} />
                }}
            </RequestContext.Consumer>
        );
    };
}

export default AttachRequest;




