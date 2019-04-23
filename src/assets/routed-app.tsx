import React, { ReactNode } from 'react';

import { StaticRouter, matchPath } from 'react-router';
import { Switch, Route, BrowserRouter, HashRouter, Link } from 'react-router-dom';

//import {useContext} from "react"
//import {__RouterContext} from "react-router"

import RedirectWithStatus from './redirect-w-status';
import AttachRequest from '../components/attach-request';

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
    customType?: any

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
    redirects: Array<IRedirect>
};


const RoutedApp: React.SFC<RoutedAppProps> = (props) => {
    //.filter(({ customType }) => customType !== Types.IFRAME)
    // (p) => render(Object.assign({},p, props))
    //console.log("RoutedApp: " , useContext(__RouterContext))

    const routes = props.routes.map(({ path, exact, component, render }, i) => {
        //console.log("routepath: ", path)
        // NOT using routeConfig.pathToRoute(path) for the Router includes a basename already!
        return render !== undefined ? <Route key={'ROUTE_'+i} exact={exact} path={path} render={render} />:
            <Route key={'ROUTE_'+i} exact={exact} path={path} component={component} />
    });

    const redirects = props.redirects.map(({ from, to, status }, i) =>
        <RedirectWithStatus key={'REDIRECT_'+i} from={from} to={to} status={status} />
    );


    return <Switch>
        {routes}
        {redirects}
    </Switch>;

};

/**
 * TODO when we use an internal link that attaches a path-parameter, do we get this here? maybe we need to force a reload from the server
 *
 * @param routes
 * @param redirects
 * @param basename
 * @returns {any}
 */
export const createClientApp = (routes: Array<IRoute>, redirects: Array<IRedirect>, basename: string) => {
    return <BrowserRouter basename={basename}>
        <AttachRequest>
            <RoutedApp routes={routes} redirects={redirects}/>
        </AttachRequest>
    </BrowserRouter>;
};

export const createServerApp = (
    routes: Array<IRoute>,
    redirects: Array<IRedirect>,
    basename: string,
    url: string,
    context: any,
    request: any) => {

    return <StaticRouter context={context} location={url} basename={basename}>
        <AttachRequest request={request}>
            <RoutedApp routes={routes} redirects={redirects}/>
        </AttachRequest>
    </StaticRouter>;
};

export const createSinglePageApp = (routes: Array<IRoute>, redirects: Array<IRedirect>) => {
    return <HashRouter>
        <RoutedApp routes={routes} redirects={redirects}/>
    </HashRouter>;
};
