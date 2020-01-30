
import React, { ReactNode } from 'react';

import Types from '../types';
import { IConfiguration } from "../types/configuration";
import { IInfrastructure } from "../types";

import { isRoute } from '../route/route-component';

import {getChildrenArray, findComponentRecursively} from '../libs';

import { SoaPlugin } from './soa-plugin';
import { EnvironmentPlugin } from '../environment/environment-plugin';
import { ServicePlugin } from "../service/service-plugin";
import { isService } from "../service/service-component";
import {DataLayerPlugin} from "../datalayer/datalayer-plugin";
import {isDataLayer} from "../datalayer/datalayer-component";
import {StoragePlugin} from "../storage/storage-plugin";
import {isStorage} from "../storage/storage-component";

export const SERVICEORIENTED_INSTANCE_TYPE = "ServiceOrientedComponent";

/**
 * Specifies all the properties that an SinglePage-Component must get from the user, as args
 */
export interface IServiceOrientedArgs {

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
    region: string
}

/**
 * specifies the properties that an SinglePage-Component has during runtime
 * nothing else than we get from the user!
 */
export interface IServiceOrientedProps {
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

    /**
     * Services of the app
     */
    services: Array<any>,

    /**
     * Filled when the Isomorphic App has a DataLayer
     */
    dataLayerId?: string,

    /**
     * Additional iam-permissions
     * e.g. [
     * {
     *   Effect: "Allow",
     *   Action: ["dynamodb:Query"],
     *   Resource:  "arn:aws:dynamodb:us-west-2:111110002222:table/my-new-table"
     * }
     * ]
     */
    iamRoleStatements?: Array<any>
}

/**
 * The SinglePageApp is an infrastructure and must implement [[IInfrastructure]]
 *
 * @param props
 */
export default (props: IServiceOrientedArgs | any) => {

    //console.log ("isomorphic: ",props );

    const infProps: IInfrastructure & IConfiguration = {

        // allows to identify this component as Infrastructure
        infrastructureType: Types.INFRASTRUCTURE_TYPE_CONFIGURATION,

        instanceId: props.stackName,
        
        instanceType: SERVICEORIENTED_INSTANCE_TYPE,

        // only load plugins during compilation
        createPlugins: (configPath: string, stage: string | undefined, parserMode: string) => props.infrastructureMode === "COMPILATION" ? [
            // be able to process IsomorphicApps (as top-level-node)
            SoaPlugin({
                stage: stage,
                parserMode: parserMode,
                buildPath: props.buildPath,
                configFilePath: configPath
            }),

            // ServiceOriented apps can have different environments
            EnvironmentPlugin({
                stage: stage,
                parserMode: parserMode
            }),

            ServicePlugin({}),

            DataLayerPlugin({
                parserMode: parserMode,
                buildPath: props.buildPath,
                configFilePath: configPath,
            }),


            StoragePlugin({
                buildPath: props.buildPath,
                parserMode: parserMode
            })

        ] : []
    };

    // TODO maybe edit to support the web-mode?!
    const spaProps: IServiceOrientedProps = {
        id: props.stackName,

        routes: getChildrenArray(props.children)
            .filter(child => isRoute(child)),

        redirects: [],

        services: findComponentRecursively(props.children, c => isService(c) || isStorage(c)),

        dataLayerId: findComponentRecursively(props.children, isDataLayer).reduce((res, dl) => res ? res : dl.id, undefined)
    }
    

    return Object.assign(props, infProps, spaProps);


};

export function isServiceOrientedApp(component) {
    return component !== undefined &&
        component.instanceType === SERVICEORIENTED_INSTANCE_TYPE
}