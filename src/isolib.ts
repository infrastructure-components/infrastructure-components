/**
 * takes a SlsIsomorphic Component and parses it into an Iso-Config
 *
 * @param component a SlsIsomorphic React-Component
 */
import {ConfigTypes} from "./lib/config";
import React from 'react';
import * as deepmerge from 'deepmerge';

const isClientApp = (component) => {

    return component.props &&
        component.props.id !== undefined &&
        component.props.path !== undefined &&
        component.props.method !== undefined ? true : false;
};

const isMiddleware = (component) => {

    return component.props &&
        component.props.callback !== undefined ? true : false;
};

const isRedirect = (component) => {

    return component.props &&
        component.props.from !== undefined &&
        component.props.to !== undefined &&
        component.props.status !== undefined ? true : false;
};

const isRoute = (component) => {

    return component.props &&
        component.props.path !== undefined &&
        (component.props.render !== undefined || component.props.component !== undefined) &&
        component.props.name !== undefined ? true : false;
};

export const parseCustomComponent = (component, compileMode) => {

    try {

        //console.log("parseCustomComponent: " , component);


        const params = Object.assign({
            infrastructureMode: compileMode ? "compile" : undefined,
        }, component.props);

        var custom = undefined;
        const parsed = `const f=${component.type}; f(${JSON.stringify(params)})`;

        const result = eval(parsed);

        //console.log("isCustomComponent: ", component)
        //console.log("parsed: ", parsed);
        //console.log("result: ", result);

        return result.infrastructureType !== undefined ? result : undefined;

    } catch (error) {
        //console.error(error);
        return undefined;
    }


}

export const getChildrenArray = (component) => {
    if (component.props.children == undefined) {
        return [];
    }

    return Array.isArray(component.props.children) ? component.props.children : [component.props.children];
};

const applyMiddleware = (mwComponent) => {
    return mwComponent.props.callback;
};


const parseMiddlewares = (component) => {
    return getChildrenArray(component)
        .filter(child => isMiddleware(child))
        .map(child => applyMiddleware(child));
}

const applyClientApp = (caComponent) => {

    //console.log("applyClientApp: " , caComponent);

    return Object.assign(
        Object.assign({}, caComponent.props),
        {
            middlewareCallbacks: (caComponent.props.middlewareCallbacks !== undefined ?
                caComponent.props.middlewareCallbacks : []).concat(parseMiddlewares(caComponent)),

            redirects: (caComponent.props.redirects !== undefined ?
                caComponent.props.redirects : []).concat(parseRedirects(caComponent)),

            routes: (caComponent.props.routes !== undefined ?
                caComponent.props.routes : []).concat(parseRoutes(caComponent)),
        }
    );

};


export const applyCustomComponents = (component: any, addToTopLevelConfig, addDataLayer, compileMode) => {
    //getChildrenArray(caComponent).forEach( c => {
        const customComponent = parseCustomComponent(component, compileMode);

        if (customComponent !== undefined && compileMode) {
            console.log("CustomComponent: ", customComponent);

            if (customComponent.infrastructureType === "dataLayer") {
                addDataLayer(customComponent);
            }

            // now add to the configuration
            addToTopLevelConfig(customComponent);

            // we expect a single one child!!
            if (Array.isArray(customComponent.children)) {
                throw new Error("custom Components must have a single one child!");
            }


            //console.log("component: " , component);
            //return component.props.children

            var customProps = {}
            customProps[customComponent.infrastructureType] = Object.assign(
                {},
                customComponent /*component.props*/,
                {infrastructureMode: "component"}
            )

            // add the custom props to the child that is forwarded
            return React.cloneElement(component.props.children, Object.assign({}, component.props.children.props, customProps))



        } else if (customComponent !== undefined) {
            //console.log("applyCustomComponents | customComponent ")

            if (React.isValidElement(component)) {
                //console.log("custom component is a react-component, " , component)
                if (Array.isArray(customComponent.children)) {
                    throw new Error("custom Components must have a single one child!");
                }

                const child = component["props"]["children"];
                
                var customProps = {}
                customProps[customComponent.infrastructureType] = React.cloneElement(component, Object.assign({}, component.props, {infrastructureMode: "component"}))

                console.log("customProps: " , customProps);
                
                const result = React.cloneElement(component, Object.assign({}, child.props, customProps));

                if (customComponent.infrastructureType === "dataLayer") {
                    addDataLayer(result);
                }

                return result;
                //return React.cloneElement(component, Object.assign({}, component.props, {infrastructureMode: "component"}))

            }

            return component.props.children;
        }

        // when the component is NOT a custom one, we return it
        return component;

    //});
}

const parseRedirects = (component) => {
    return getChildrenArray(component)
        .filter(child => isRedirect(child))
        .map(child => applyRedirect(child));
};

const applyRedirect = (redirectComponent) => {
    //console.log("redirect: ", redirectComponent.props);
    return redirectComponent.props
};

const parseRoutes = (component) => {
    return getChildrenArray(component)
        .filter(child => isRoute(child))
        .map(child => applyRoute(child, component.props.method));
};

const applyRoute = (routeComponent, method) => {
    //console.log("route: ", routeComponent.props);
    return Object.assign(
        Object.assign({}, routeComponent.props),
        {
            method: method,
            exact: true,
            middlewareCallbacks: (routeComponent.props.middlewareCallbacks !== undefined ?
                routeComponent.props.middlewareCallbacks : []).concat(parseMiddlewares(routeComponent)),
        }
    );
};


export function loadIsoConfigFromComponent(component: any, compileMode: boolean = true) {

    //console.log("child: ", component.props.children.props);

    var arrConfigs = [];
    const addToTopLevelConfig = (c) => {
        //console.log("addToTopLevelConfig: ", c);

        const allowed = ['slsConfig', 'ssrConfig'];

        arrConfigs.push(Object.keys(c)
            .filter(key => allowed.includes(key))
            .reduce((obj, key) => {
                obj[key] = c[key];
                return obj;
            }, {})
        );
    }

    var arrDataLayers = [];
    const addDataLayer = (dlComponent) => {
        arrDataLayers.push(dlComponent);
    }
    
    const clientApps= getChildrenArray(component)
        .map(child => applyCustomComponents(child, addToTopLevelConfig, addDataLayer, compileMode))
        .filter(child => isClientApp(child))
        .map(child => applyClientApp(child));

    console.log("arrConfigs: " , arrConfigs)

    const result = deepmerge.all([{
        type: ConfigTypes.ISOMORPHIC,
        isoConfig: {
            middlewares: parseMiddlewares(component),

            clientApps: clientApps,
            
            dataLayers: arrDataLayers
        },

        ssrConfig: {
            stackName: component.props.stackName,
            buildPath: component.props.buildPath,
            assetsPath: component.props.assetsPath
        },

        slsConfig: {}
    }, ...arrConfigs
    ]);

    //console.log("loaded IsoConfig: " , result);
    return result;

}
