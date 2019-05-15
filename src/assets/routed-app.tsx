import React, { ReactNode } from 'react';

import { StaticRouter, matchPath } from 'react-router';
import { Switch, Route, BrowserRouter, HashRouter, Link } from 'react-router-dom';

//import {useContext} from "react"
//import {__RouterContext} from "react-router"

import RedirectWithStatus from './redirect-w-status';
import ForceLogin from './force-login';
//import AttachRequest from '../components/attach-request';
//import AttachRoutes from './attach-routes';


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

    // when the app is part of an <Identity />-Component, it should have an identityKey
    identityKey?: string
};


const RoutedApp: React.SFC<RoutedAppProps> = (props) => {
    //.filter(({ customType }) => customType !== Types.IFRAME)
    // (p) => render(Object.assign({},p, props))
    //console.log("RoutedApp: " , useContext(__RouterContext))

    const routes = props.routes.map(({ path, exact, component, render, isSecured }, i) => {
        //console.log("routepath: ", path)
        // NOT using routeConfig.pathToRoute(path) for the Router includes a basename already!

        if (render !== undefined) {
            const wrappedRender = (p) => isSecured ? <ForceLogin identityKey={props.identityKey}>{render(p)}</ForceLogin> : render(p);
            return <Route key={'ROUTE_'+i} exact={exact} path={path} render={wrappedRender} />

        } else if (isSecured) {

            const C: any = component;
            return <Route
                key={'ROUTE_'+i}
                exact={exact}
                path={path}
                render={(p) => <ForceLogin identityKey={props.identityKey}><C {...p}/></ForceLogin>}
            />

        } else {

            return <Route key={'ROUTE_'+i} exact={exact} path={path} component={component} />
        }

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
export const createClientApp = (routes: Array<IRoute>, redirects: Array<IRedirect>, identityKey: string | undefined, basename: string) => {
    const AttachRequest = require("infrastructure-components").AttachRequest;
    const AttachRoutes = require("infrastructure-components").AttachRoutes;

    return <BrowserRouter basename={basename}>
        <AttachRequest>
            <AttachRoutes routes={routes}>
                <RoutedApp routes={routes} redirects={redirects} identityKey={identityKey}/>
            </AttachRoutes>
        </AttachRequest>
    </BrowserRouter>;
};

export const createServerApp = (
    routes: Array<IRoute>,
    redirects: Array<IRedirect>,
    identityKey: string | undefined,
    basename: string,
    url: string,
    context: any,
    request: any) => {

    const AttachRequest = require("infrastructure-components").AttachRequest;
    const AttachRoutes = require("infrastructure-components").AttachRoutes;

    return <StaticRouter context={context} location={url} basename={basename}>
        <AttachRequest request={request}>
            <AttachRoutes routes={routes}>
                <RoutedApp routes={routes} redirects={redirects} identityKey={identityKey}/>
            </AttachRoutes>
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
