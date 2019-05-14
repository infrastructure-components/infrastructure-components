import React, {ReactNode} from 'react';


import uuidv4 from 'uuid/v4';

import {IComponent} from "../types/component";
import Types, { IInfrastructure } from "../types";

import createMiddleware, { isMiddleware } from '../middleware/middleware-component';
import createWebApp, { isWebApp } from '../webapp/webapp-component';

import { getChildrenArray, findComponentRecursively } from '../libs';
import cookiesMiddleware from 'universal-cookie-express';

export const IDENTITY_INSTANCE_TYPE = "IdentityComponent";

const getBrowserId = (req, key) => {
    const browserId = req.universalCookies.get(key);

    if (browserId !== undefined) {
        return browserId;

    } else {
        const newId = uuidv4();
        req.universalCookies.set(key, newId);
        return newId;
    }
}



/**
 * Specifies all the properties that a Authentication-Component must have
 */
export interface IIdentityArgs {

    /**
     * The key specifies the pk that the Identity uses in the DataLayer to store its identifier at
     */
    key: string,


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

    //console.log ("route: ",props );

    const componentProps: IInfrastructure & IComponent = {
        infrastructureType: Types.INFRASTRUCTURE_TYPE_COMPONENT,
        instanceType: IDENTITY_INSTANCE_TYPE,
        instanceId: undefined, // authentications cannot be found programmatically?!
    };


    const identityProps: IIdentityProps = {
        setStoreData: (storeData: (pkEntity: string, pkVal: any, skEntity: string, skVal: any, jsonData: any) => void) => {
            props.storeData = storeData;
        }
    }

    /**
     * The Identity requires cookies to store an uuid
     */
    const mappedChildren = {
        // we provide the middlewares that we require
        children: [
            
            // we need to use cookies in order to verify whether a user is logged in
            createMiddleware({ callback: cookiesMiddleware() }),

        ].concat(props.children).map(child => {

            // if the child needs to store data that belongs to the user, provide a function to do so!
            if (child.setStoreIdentityData !== undefined) {
                child.setStoreIdentityData(

                    (request: any, key: string, val: any, jsonData: any) => {
                        props.storeData(
                            props.key, //pkEntity: string,
                            getBrowserId(request, props.key), //pkVal: any,
                            key, //skEntity: string,
                            val, //skVal: any,
                            jsonData //: any
                        )
                    }
                )

            }

            return child;
        })
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