import React, {ReactNode} from 'react';

import Types from '../types';
import { IComponent} from "../types/component";
import { IInfrastructure } from "../types";
import {ENTRY_INSTANCE_TYPE, createEntryProps, IEntryArgs} from "../datalayer/entry-component";
import { IC_USER_ID} from "./auth-middleware";
import createMiddleware from '../middleware/middleware-component';

import ConnectSequence from 'connect-sequence';

import { getEntryListQuery, setEntryMutation, setEntry, ddbListEntries } from '../datalayer/datalayer-libs';


import {
    graphql,
    GraphQLObjectType,
    GraphQLString,
    GraphQLNonNull,
    GraphQLList,
    GraphQLInputObjectType
}  from 'graphql';


export interface ISecuredEntryProps {

    /**
     * Functions that the Authentication-Component looks for
     */
    setUserId: any,
    setMiddleware: any,
    externalMiddleware?: any,

    /**
     * the id of the authentication-provider
     */
    userId?: any,


}

/**
 * an entry specifies a kind of data that can be stored in a line of the table
 */
export default (props: IEntryArgs | any) => {

    // the component must have the properties of IComponent
    const componentProps: IInfrastructure & IComponent = {
        infrastructureType: Types.INFRASTRUCTURE_TYPE_COMPONENT,
        instanceType: ENTRY_INSTANCE_TYPE,
        instanceId: props.id
    };
    
    const mwProps = {
        middleware: createMiddleware({callback: (req, res, next) => {
            console.log("this is the default mw of the SecuredEntry: ", props.id)

            if (securedEntryProps.externalMiddleware) {
                console.log("now using the provided middleware")
                return new ConnectSequence(req, res, next)
                    .append(securedEntryProps.externalMiddleware.callback)
                    .run();
            }
            return next();

        }})
    };

    const securedEntryProps: ISecuredEntryProps = {
        //origRangeKey: props.rangeKey,

        setUserId: (userId) => {
            console.log(props.id, " received userId: ", userId)
            securedEntryProps.userId = userId;
            //props.rangeKey = IC_USER_ID
        },

        /**
         * We MUST NOT OVERWRITE exisiting functions, only data. middleware is a function
         * because they get not called
         */

        // the authentication-component replaces the middleware!
        setMiddleware: (mw) => {
            console.log(props.id, " received middleware: ", mw)
            securedEntryProps.externalMiddleware = mw;
        }
    };

    const entryProps: any = createEntryProps(Object.assign({}, props, componentProps, securedEntryProps));

    const setUserIdFromContext = (context) => {

        //console.log("check userId? ", entryProps, props, securedEntryProps)
        // when called through ssr, we do not get the userId through the ICs. But the DataLayer-Integration puts
        // it into the context for us

        if (securedEntryProps && securedEntryProps.userId) {
            console.log("SecuredEntry already has userId, not taking from context: ", securedEntryProps.userId);
            return;
        }

        if (context && context.userId) {
            if (securedEntryProps) {
                securedEntryProps["userId"] = context["userId"];

            } else {
                console.error("no entryProps exist, cannot set userId")
            }
            return;
        }

        console.warn("no userId in context or in entryProps...")

    };


    return Object.assign(entryProps, {

        // we need to adjust the writing into the table
        setEntry: (args, context, tableName) => {

            setUserIdFromContext(context);


            return setEntry(
                tableName, //"code-architect-dev-data-layer",
                props.primaryKey, // schema.Entry.ENTITY, //pkEntity
                args[props.primaryKey], // pkId
                IC_USER_ID, //schema.Data.ENTITY, // skEntity
                `${securedEntryProps.userId}|${props.rangeKey}|${args[props.rangeKey]}`, // skId
                Object.keys(args).reduce((result, key) => {
                    if (Object.keys(props.data).find(datakey => datakey === key) !== undefined) {
                        result[key] = args[key];
                    }
                    return result;
                },{}) // jsonData
            );
        },

        listEntries: (args, context, tableName, key) => {

            setUserIdFromContext(context);

            const entity = key === "pk" ? props.primaryKey : `${IC_USER_ID}|${securedEntryProps.userId}|${props.rangeKey}`;
            const range = key === "pk" ? `${IC_USER_ID}|${securedEntryProps.userId}|${props.rangeKey}` : props.primaryKey;


            return ddbListEntries(
                tableName, //tablename
                key, // key
                entity, //entity
                args[key === "pk" ? props.primaryKey : props.rangeKey], //value
                range //rangeEntity
            ).then(results => {

                console.log("promised: ", results);
                return results.map(item => {
                    const data = item.jsonData !== undefined ? JSON.parse(item.jsonData) : {};
                    data[props.primaryKey] = item.pk.substring(item.pk.indexOf("|")+1);
                    data[props.rangeKey] = item.sk.substring(item.sk.indexOf("|")+1);
                    return data;
                });

            });

        },

    }, mwProps);
    // we provide the newly set middleware as last prop to overwrite the other values!

};


export const isSecuredEntry = (component) => {

    return component !== undefined &&  component.instanceType === ENTRY_INSTANCE_TYPE;
};



const complementedProps = {

    /*
     createEntryFields: () => {
     const fields = Object.keys(props.data).reduce((result, key)=> {
     if (key !== securedEntryProps.origRangeKey) {
     result[key] = {type: props.data[key]};
     }


     return result;
     }, {});

     fields[props.primaryKey] = {type: GraphQLString};
     fields[IC_USER_ID] = {type: GraphQLString};

     return fields;
     },

     createEntryType: (prefix) => {
     return new GraphQLObjectType({
     name: prefix+props.id,
     fields: () => complementedProps.createEntryFields()
     })
     },

     createKeyArgs: () => {

     const args = {};

     args[props.primaryKey] = {name: props.primaryKey, type: GraphQLString};
     args[IC_USER_ID] = {name: IC_USER_ID, type: GraphQLString};

     return args;
     },* /

     getEntryListQuery: (dictKey) => {
     const fields = entryProps.createEntryFields();
     //console.log("fields: ", fields);

     return getEntryListQuery(
     props.id,
     dictKey,
     fields,
     {
     userId: securedEntryProps.userId
     } //context
     );
     },

     setEntryMutation: (values) => {
     const fields = entryProps.createEntryFields();
     //console.log("fields: ", fields);

     return setEntryMutation(
     props.id,
     values,
     fields,
     {
     userId: securedEntryProps.userId
     } //context
     );

     },

     /*

     // let's overwrite how the user can get the
     getEntryListQuery: (dictKey) => {
     const fields = complementedProps.createEntryFields();
     //console.log("fields: ", fields);

     // TODO, complement dictKey or even change the whole query ...
     return getEntryListQuery(
     props.id,
     Object.keys(dictKey).reduce((res, key) => {
     // we replace the rangeKey with the
     if (key === securedEntryProps.origRangeKey) {
     res[props.rangeKey] = `${securedEntryProps.clientId}|${securedEntryProps.origRangeKey}|${dictKey[key]}`
     } else {
     res[key] = dictKey[key];
     }
     return res;
     }, {}),
     fields
     );
     },

     // this creates the input for the gql-tag: how the query is sent to apollo
     setEntryMutation: (values) => {
     const fields = complementedProps.createEntryFields();


     return setEntryMutation(
     props.id,
     Object.keys(values).reduce((res, key) => {
     // we replace the rangeKey with the
     if (key === securedEntryProps.origRangeKey) {
     res[props.rangeKey] = `${securedEntryProps.clientId}|${securedEntryProps.origRangeKey}|${values[key]}`
     } else {
     res[key] = values[key];
     }
     return res;
     }, {}),
     fields,
     {
     // we need to pass the clientId into the context of the gql-query for we don't have the value there yet!
     clientId: securedEntryProps.clientId
     } //context
     );
     }*/
};