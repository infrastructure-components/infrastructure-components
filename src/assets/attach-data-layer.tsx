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

                        return context.dataLayer.setEntryMutation(
                            entryId,
                            values
                        );
                    }

                    //console.log("entryListQuery: ", entryListQuery);
                    
                    return <Component
                        {...props}
                        apolloClient={context.apolloClient}
                        getEntryListQuery={entryListQuery}
                        getEntryQuery={getEntryQuery}
                        setEntryMutation={setEntryMutation}
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
            return complementedCallback(req.dataLayer, req, res, next)
        }
    ]
};

export const serviceAttachDataLayer = (dataLayer) => {
    return (req, res, next) => {

        const client = createApolloClient(dataLayer, getGraphqlUrl(), req);
        dataLayer.setClient(client);

        console.log("attaching the dataLayer, client: ", client);

        req.dataLayer = dataLayer;
        req.dataLayer.client = client;
        next();
    };
}

export default AttachDataLayer;




