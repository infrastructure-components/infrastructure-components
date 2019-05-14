
import Types from './index'

/**
 * A Component has no required function beyond the ones defined in IInfrastructure
 *
 */
export interface IComponent {

    /**
     * A component can implement this function to insulate/hide the components of the specified from higher level
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
export const isComponent = (parsedComponent): boolean => {
    if (parsedComponent !== undefined) {
        return parsedComponent.infrastructureType === Types.INFRASTRUCTURE_TYPE_COMPONENT
    }

    return false;
};

