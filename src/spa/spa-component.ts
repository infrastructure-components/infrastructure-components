
import React, { ReactNode} from 'react';

import Types from '../types';
import { IConfiguration } from "../types/configuration";
import { IInfrastructure } from "../types";

import { isMiddleware } from '../middleware/middleware-component';
import { isWebApp } from '../webapp/webapp-component';
import { isRoute } from '../route/route-component';

import { getChildrenArray } from '../libs';

import { SpaPlugin } from './spa-plugin';
import { WebAppPlugin } from '../webapp/webapp-plugin';
import { EnvironmentPlugin } from '../environment/environment-plugin';

export const SINGLEPAGE_INSTANCE_TYPE = "SinglePageComponent";

/**
 * Specifies all the properties that an SinglePage-Component must get from the user, as args
 */
export interface ISinglePageArgs {

    /**
     * name of the Cloudformation Stack
     */
    stackName: string,

    /**
     * Local, relative directory specifies where to put the final bundles
     */
    buildPath: string,

    /**
     * The AWS region
     */
    region: string,

    /**
     * optional, custom domain name
     */
    domain?: string
}

/**
 * specifies the properties that an SinglePage-Component has during runtime
 * nothing else than we get from the user!
 */
export interface ISinglePageProps {
    /**
     * the SPA is webapp and must have an id
     */
    id: string,

    /**
     * Routes of the webapp
     */
    routes: Array<any>,

    /**
     * redirects of the webapp
     */
    redirects: Array<any>,

    basename: string
}

/**
 * The SinglePageApp is an infrastructure and must implement [[IInfrastructure]]
 *
 * @param props
 */
export default (props: ISinglePageArgs | any) => {

    //console.log ("isomorphic: ",props );

    const infProps: IInfrastructure & IConfiguration = {

        // allows to identify this component as Infrastructure
        infrastructureType: Types.INFRASTRUCTURE_TYPE_CONFIGURATION,

        instanceId: props.stackName,
        
        instanceType: SINGLEPAGE_INSTANCE_TYPE,

        // only load plugins during compilation
        createPlugins: (configPath: string, stage: string | undefined, parserMode: string) => props.infrastructureMode === "COMPILATION" ? [
            // be able to process IsomorphicApps (as top-level-node)
            SpaPlugin({
                stage: stage,
                parserMode: parserMode,
                buildPath: props.buildPath,
                configFilePath: configPath
            }),

            // Single Page apps can have different environments
            EnvironmentPlugin({
                stage: stage,
                parserMode: parserMode
            })

        ] : []
    };

    // TODO maybe edit to support the web-mode?!
    const spaProps: ISinglePageProps = {
        id: props.stackName,

        routes: getChildrenArray(props.children)
            .filter(child => isRoute(child)),

        redirects: [],

        basename: ""
    }
    

    return Object.assign(props, infProps, spaProps);


};

export function isSinglePageApp(component) {
    return component !== undefined &&
        component.instanceType === SINGLEPAGE_INSTANCE_TYPE
}