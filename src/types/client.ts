
import Types from './index'

/**
 * A Client is a component that produces its own webpack configuration
 * 
 *
 * it can run in webpack-hot-middleware-mode
 * TODO extend respectively
 */
export interface IClient {
    /**
     * A client can implement this function to insulate/hide the components of the specified from higher level
     * components
     *
     * @param component the component that a higher level component wants to have
     * @return true if the component does NOT want to provide its children to higher level components
     */
    insulatesChildComponent?: (component: any) => boolean
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

