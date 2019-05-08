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

    console.log("AttachDataLayer: ", props.dataLayer);
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
                    console.log("value of context: ", context);
                    const entryListQuery = (entryId, dictKey) => {
                        const fields = context.dataLayer.getEntryDataFields(entryId);
                        console.log("fields: ", fields);

                        return getEntryListQuery(
                            entryId,
                            dictKey,
                            fields
                        );
                    };

                    //console.log("entryListQuery: ", entryListQuery);
                    
                    return <Component
                        {...props}
                        apolloClient={context.apolloClient}
                        getEntryListQuery={entryListQuery}
                    />
                }}
            </DataLayerContext.Consumer>
        );
    };
}

export default AttachDataLayer;




