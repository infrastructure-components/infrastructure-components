import React, { ReactNode } from 'react';

import { StaticRouter, matchPath } from 'react-router';
import { Switch, Route, BrowserRouter, HashRouter, Link, withRouter } from 'react-router-dom';

//import {useContext} from "react"
//import {__RouterContext} from "react-router"

import RedirectWithStatus from './redirect-w-status';


/**
 * Implementation of the RoutingAbstractionLayer
 *
 */

export interface IRoute {

    /**
     * the relative  path of the route, e.g. "/" for the root, or "/something"
     */
    path: string,

    /**
     * The http method of the route, e.g. get, post, ...
     */
    method: string,

    /**
     * array of callbacks to be used of a route before handing over to the "*"-callback
     */
    middlewares: Array<any>,


    /**
     *
     * @param props any props to be passed to the Component to be rendered
     * @return rendered(!) ReactNode of the Route, e.g. (<TestPage {...props}/>)
     */
    render?: (props: any) => ReactNode,

    component?: any,

    /**
     * The displayed name of the route (e.g. in Menu)
     */
    name: string,

    /**
     * exact route required?
     */
    exact: boolean,

    /**
     * a custom type to be used to distinguish different types of Routes
     */
    customType?: any,

    /**
     * If true, the route is secured and requires the user to login. I.e. wraps the route into <ForceLogin />
     *
     * default: false
     */
    isSecured?: boolean


}

export interface IRedirect {
    /**
     * the path to be redirected , e.g. '/any'
     */
    from: string,

    /**
     * the path to be redirected to, e.g. "/"
     */
    to: string,

    /**
     * the http-status code to use when redirecting, e.g. 301
     */
    status: number
}

interface RoutedAppProps {
    routes: Array<IRoute>,
    redirects: Array<IRedirect>,
    listen?: (location, action) => any
    history: any // attached trough with Router
    
};

interface RoutedAppState {
}


class RawRoutedApp extends React.Component<RoutedAppProps, RoutedAppState> {

    private unlisten: any;

    componentWillMount() {
        if (this.props.listen) {
            this.unlisten = this.props.history.listen(this.props.listen);
        }


    }


    componentWillUnmount() {
        if (this.unlisten) {
            this.unlisten();
        }

    }


    render () {
        //.filter(({ customType }) => customType !== Types.IFRAME)
        // (p) => render(Object.assign({},p, props))
        //console.log("RoutedApp: " , useContext(__RouterContext))

        const ForceLogin = require("infrastructure-components").ForceLogin;

        const routes = this.props.routes.map(({ path, exact, component, render, isSecured }, i) => {
            //console.log("routepath: ", path)
            // NOT using routeConfig.pathToRoute(path) for the Router includes a basename already!

            if (render !== undefined) {
                const wrappedRender = (p) => isSecured ? <ForceLogin >{render(p)}</ForceLogin> : render(p);
                return <Route key={'ROUTE_'+i} exact={exact} path={path} render={wrappedRender} />

            } else if (isSecured) {

                const C: any = component;
                return <Route
                    key={'ROUTE_'+i}
                    exact={exact}
                    path={path}
                    render={(p) => <ForceLogin ><C {...p}/></ForceLogin>}
                />

            } else {

                return <Route key={'ROUTE_'+i} exact={exact} path={path} component={component} />
            }

        });

        const redirects = this.props.redirects.map(({ from, to, status }, i) =>
            <RedirectWithStatus key={'REDIRECT_'+i} from={from} to={to} status={status} />
        );


        return <Switch>
            {routes}
            {redirects}
        </Switch>;
    }


};

const RoutedApp = withRouter(RawRoutedApp);

/**
 * TODO when we use an internal link that attaches a path-parameter, do we get this here? maybe we need to force a reload from the server
 *
 * @param routes
 * @param redirects
 * @param basename
 * @returns {any}
 */
export const createClientApp = (
    routes: Array<IRoute>,
    redirects: Array<IRedirect>,
    basename: string, 
    listen?: (location, action) => any,
    authCallback?: any
) => {
    
    const AttachRequest = require("infrastructure-components").AttachRequest;
    const AttachRoutes = require("infrastructure-components").AttachRoutes;
    const AttachUser = require("infrastructure-components").AttachUser;
    const AttachAuth = require("infrastructure-components").AttachAuth;

    return <BrowserRouter basename={basename}>
        <AttachRequest>
            <AttachUser>
                <AttachAuth authCallback={authCallback}>
                    <AttachRoutes routes={routes}>
                        <RoutedApp routes={routes} redirects={redirects} listen={listen}/>
                    </AttachRoutes>
                </AttachAuth>
            </AttachUser>
        </AttachRequest>
    </BrowserRouter>;
};

export const createServerApp = (
    routes: Array<IRoute>,
    redirects: Array<IRedirect>,
    basename: string,
    url: string,
    context: any,
    request: any,
    authCallback: any) => {

    const AttachRequest = require("infrastructure-components").AttachRequest;
    const AttachRoutes = require("infrastructure-components").AttachRoutes;
    const AttachUser = require("infrastructure-components").AttachUser;
    const AttachAuth = require("infrastructure-components").AttachAuth;

    return <StaticRouter context={context} location={url} basename={basename}>
        <AttachRequest request={request}>
            <AttachUser>
                <AttachAuth authCallback={authCallback}>
                    <AttachRoutes routes={routes}>
                        <RoutedApp routes={routes} redirects={redirects} />
                    </AttachRoutes>
                </AttachAuth>
            </AttachUser>
        </AttachRequest>
    </StaticRouter>;
};

export const createSinglePageApp = (routes: Array<IRoute>, redirects: Array<IRedirect>) => {

    // a single page app does not support Identities (so far). There is no identityKey={identityKey}

    const AttachRoutes = require("infrastructure-components").AttachRoutes;

    return <HashRouter>
        <AttachRoutes routes={routes}>
            <RoutedApp routes={routes} redirects={redirects}/>
        </AttachRoutes>
    </HashRouter>;
};
