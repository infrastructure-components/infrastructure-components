
import Types from './index'

/**
 * A Client is a component that produces its own webpack configuration
 * 
 *
 * it can run in webpack-hot-middleware-mode
 * TODO extend respectively
 */
export interface IClient {

}

/**
 * check whether the provided object serves as a client
 *
 * can be used in the parser, we get a real object here!
 *
 * @param parsedComponent
 */
export const isClient = (parsedComponent): boolean => {
    if (parsedComponent !== undefined) {
        return parsedComponent.infrastructureType === Types.INFRASTRUCTURE_TYPE_CLIENT
    }

    return false;
};

