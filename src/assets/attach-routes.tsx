declare var require: any;
import * as React from 'react';
import { IRoute } from './routed-app';

// create empty context as default
const RoutesContext = React.createContext({});

interface IAttachRoutesProps {
    routes: Array<IRoute>
}
/**
 * This HOC attaches the Routes of a SinglePageApp or a WebApp
 */
const AttachRoutes: React.SFC<IAttachRoutesProps> = (props) => {

    return <RoutesContext.Provider
        value={{
            routes: props.routes
        }}>{props.children}</RoutesContext.Provider>

};

/**
 * @param Component
 * @returns {function(any): any}
 */
export function withRoutes(Component) {
    return function WrapperComponent(props) {
        return (
            <RoutesContext.Consumer>
                {(context: any) => {

                    return <Component
                        {...props}
                        routes={context.routes}
                    />
                }}
            </RoutesContext.Consumer>
        );
    };
}

export default AttachRoutes;




