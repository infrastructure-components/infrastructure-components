import React, { ReactNode } from 'react';

import { StaticRouter, matchPath } from 'react-router';
import { Switch, Route, BrowserRouter } from 'react-router-dom';

import RedirectWithStatus from './redirect-w-status';
import AttachRequest from './attach-request';
//import './styles/style.css';

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
    middlewareCallbacks: Array<any>,


    /**
     *
     * @param props any props to be passed to the Component to be rendered
     * @return rendered(!) ReactNode of the Route, e.g. (<TestPage {...props}/>)
     */
    render: (props: any) => ReactNode,


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

    const routes = props.routes.map(({ path, render, exact }, i) => {
        // NOT using routeConfig.pathToRoute(path) for the Router includes a basename already!
        return <Route key={Math.random() + 'ROUTE_'} exact={exact} path={path} render={render} />
    });

    const redirects = props.redirects.map(({ from, to, status }, i) =>
        <RedirectWithStatus key={Math.random() + 'REDIRECT_'} from={from} to={to} status={status} />
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