import {createApolloClient, getGraphqlUrl} from "./datalayer-integration";
declare var require: any;
import * as React from 'react';

import { getEntryListQuery } from '../datalayer/datalayer-libs'

// create empty context as default
const DataLayerContext = React.createContext({});

interface AttachDataLayerProps {
    apolloClient?: any,
    dataLayer: any
}
/**
 * This HOC attaches the req sent to the server down to the Components - on server side only, of course!
 *
 * see hocs with context: https://itnext.io/combining-hocs-with-the-new-reacts-context-api-9d3617dccf0b
 *
 * When using the req: either check whether it is undefined or whether we run on the server -->
 * how to check whether running on server or in browser: https://www.npmjs.com/package/exenv
 */
const AttachDataLayer: React.SFC<AttachDataLayerProps> = (props) => {

    //console.log("AttachDataLayer: ", props.dataLayer);
    return <DataLayerContext.Provider
        value={{
            apolloClient: props.apolloClient,
            dataLayer: props.dataLayer
        }}>{props.children}</DataLayerContext.Provider>


};

/**
 * @param Component
 * @returns {function(any): any}
 */
export function withDataLayer(Component) {
    return function WrapperComponent(props) {
        return (
            <DataLayerContext.Consumer>
                {(context: any) => {
                    //console.log("value of context: ", context);
                    const entryListQuery = (entryId, dictKey) => {

                        //console.log("attach datalayer layer: ", context.dataLayer["isOffline"])
                        return context.dataLayer.getEntryListQuery(
                            entryId,
                            dictKey
                        );

                    };
                    
                    const getEntryQuery = (entryId, dictKey) => {

                        return context.dataLayer.getEntryQuery(
                            entryId,
                            dictKey
                        );
                        
                    };

                    const setEntryMutation = (entryId, values) => {

                        //console.log("attach datalayer layer: ", context.dataLayer["isOffline"])
                        return context.dataLayer.setEntryMutation(
                            entryId,
                            values
                        );
                    }

                    const getEntryScanQuery = (entryId, dictKey) => {

                        return context.dataLayer.getEntryScanQuery(
                            entryId,
                            dictKey
                        );

                    };

                    const deleteEntryMutation = (entryId, values) => {
                        return context.dataLayer.deleteEntryMutation(
                            entryId,
                            values
                        );
                    }

                    const createSetMutation = (useMutation, entryId, values) => {
                        const { mutation } = setEntryMutation(entryId, values);

                        const [f, { data }] = useMutation(mutation, {
                            context: context,
                            client: context.apolloClient
                        });

                        return f;
                    };

                    const createDeleteMutation = (useMutation, entryId, values) => {
                        const { mutation } = deleteEntryMutation(entryId, values);

                        const [f, { data }] = useMutation(mutation, {
                            context: context,
                            client: context.apolloClient
                        });

                        return f;
                    };

                    const createQuery = (useQuery, {query}) => {
                        return useQuery(query, {
                            context: context,
                            client: context.apolloClient
                        })
                    }

                    //console.log("entryListQuery: ", entryListQuery);
                    
                    return <Component
                        {...props}
                        apolloClient={context.apolloClient}
                        getEntryListQuery={entryListQuery}
                        getEntryQuery={getEntryQuery}
                        setEntryMutation={setEntryMutation}
                        getEntryScanQuery={getEntryScanQuery}
                        deleteEntryMutation={deleteEntryMutation}
                        createSetMutation={createSetMutation}
                        createDeleteMutation={createDeleteMutation}
                        createQuery={createQuery}
                    />
                }}
            </DataLayerContext.Consumer>
        );
    };
}


export const serviceWithDataLayer = (complementedCallback: (cbdataLayer, cbreq, cbres, cbnext) => any) => {

    // we return an array of valid middleware-callbacks
    return [
        async function (req, res, next) {
            return await complementedCallback(req.dataLayer, req, res, next)
        }
    ]
};

export const serviceAttachDataLayer = (dataLayer) => {
    return (req, res, next) => {

        const client = createApolloClient(dataLayer, getGraphqlUrl(dataLayer.isOffline), req);
        dataLayer.setClient(client);

        //console.log("attaching the dataLayer, client: ", client);

        req.dataLayer = dataLayer;
        req.dataLayer.client = client;
        next();
    };
}

export default AttachDataLayer;




