import React, {ReactNode} from 'react';


import uuidv4 from 'uuid/v4';

import {IComponent} from "../types/component";
import Types, { IInfrastructure } from "../types";

import createMiddleware, { isMiddleware } from '../middleware/middleware-component';
import createWebApp, { isWebApp } from '../webapp/webapp-component';

import { getChildrenArray, findComponentRecursively } from '../libs';
import cookiesMiddleware from 'universal-cookie-express';

export const IDENTITY_INSTANCE_TYPE = "IdentityComponent";

export const getBrowserId = (req, key=IDENTITY_KEY) => {
    const browserId = req.universalCookies.get(key);

    if (browserId !== undefined) {
        return browserId;

    } else {
        const newId = uuidv4();
        req.universalCookies.set(key, newId);
        return newId;
    }
}



export const IDENTITY_KEY ="IC_IDENTITY_KEY";

/**
 * Specifies all the properties that a Authentication-Component must have
 */
export interface IIdentityArgs {


}


/**
 * specifies the properties that an Identity-Component has during runtime
 */
export interface IIdentityProps {

    /**
     * Function that allows the identity to store the user-data
     * filled by the DataLayer
     *
     * @storeData: a function that storesData
     */
    setStoreData: (
        storeData: (pkEntity: string, pkVal: any, skEntity: string, skVal: any, jsonData: any) => void
    ) => void

    storeData?: (pkEntity: string, pkVal: any, skEntity: string, skVal: any, jsonData: any) => void
}


/**
 * The Identity-Component uses cookies to uniquely identify a browser
 *
 * @param props
 */
export default (props: IIdentityArgs | any) => {

    console.log ("Identity: ",props );

    const componentProps: IInfrastructure & IComponent = {
        infrastructureType: Types.INFRASTRUCTURE_TYPE_COMPONENT,
        instanceType: IDENTITY_INSTANCE_TYPE,
        instanceId: undefined, // authentications cannot be found programmatically?!
    };


    const identityProps: IIdentityProps = {
        setStoreData: (storeData: (pkEntity: string, pkVal: any, skEntity: string, skVal: any, jsonData: any) => void) => {
            //console.log("setStoreData: ",storeData)
            props.storeData = storeData;
        }
    }

    // if the child needs to store data that belongs to the user, provide a function to do so!
    findComponentRecursively(props.children, (child) => child.setStoreIdentityData !== undefined).forEach( child => {

        child.setStoreIdentityData(

            async function (request: any, secondaryKey: string, val: any, jsonData: any) {
                console.log("identity: storeData: ", props);
                return await props.storeData(
                    IDENTITY_KEY, //pkEntity: string,
                    getBrowserId(request, IDENTITY_KEY), //pkVal: any,
                    secondaryKey, //skEntity: string,
                    val, //skVal: any,
                    jsonData //: any
                )
            }
        );

    });

    
    /**
     * The Identity requires cookies to store an uuid
     */
    const mappedChildren = {
        // we provide the middlewares that we require
        children: [
            
            // we need to use cookies in order to verify whether a user is logged in
            createMiddleware({ callback: cookiesMiddleware() }),


            // here we provide all interested children with the identity - on server side only!
            // but for the browser, we provide the cookie
            createMiddleware({ callback: (req, res, next) => {

                console.log("this it the identity-mw")
                findComponentRecursively(props.children, (child) => child.setIdentity !== undefined).forEach( child => {
                    child.setIdentity(getBrowserId(req, IDENTITY_KEY));
                });

                return next();
            }})

        ].concat(props.children)
    };

    //console.log("mapped children: ", mappedChildren.children.filter(c=> isWebApp(c)).map(c=> c.routes.map(r=>r.middlewares)));

    //console.log("identity children: ", findComponentRecursively(props.children, isWebApp));
    //console.log("identity mapped children: ", findComponentRecursively(mappedChildren.children, isWebApp));

    return Object.assign(props, componentProps, identityProps, mappedChildren);


};

export const isIdentity = (component) => {

    return component !== undefined &&
        component.instanceType === IDENTITY_INSTANCE_TYPE;
};