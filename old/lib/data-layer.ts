
import {ReactNode} from "react";

/**
 * The DataLayer is a Isomorphic App that supports connecting a database and providing
 * server side data to the client
 */

export interface IDataLayer {
    /**
     * This function only takes the app as parameter, set the schema of the implementation to the real one
     * if you want to avoid network calls on the server side (rendering)
     */
    connectWithDataLayer?: (ReactNode) => any,

    /**
     * Puts the data back into the app
     * @param ReactNode
     */
    hydrateFromDataLayer?: (ReactNode) => ReactNode,
}