/**
 * Created by frank.zickert on 05.04.19.
 */



/**
 * Get the children of the current component as an array
 *
 *
 * @param component the parent component
 * @return an Array of the children, even if there is only a single child or no (empty array). If the component itself
 * is an array, its items are returned
 */
export const getChildrenArray = (component) => {

    if (component == undefined) {
        return [];
    }

    if (Array.isArray(component) && component.length > 0) {
        //console.log("component is array: ", component)
        return [...component] ;
    }

    if (component.children == undefined) {
        return [];
    }

    return Array.isArray(component.children) ? component.children : [component.children];
};

/**
 * Finds the components of the specified type among the (grand-)children recursively - but we assume that the same
 * types must not be parent-children, e.g. there is no middleware as child of middleware
 * But it allows components to "insulate" a component, but then, the component should do something meaningful
 * with the insulated component, e.g. a route can have its own middlewares that should not apply to the overall webapp
 *
 * @param component the parent component
 * @param isComponent a function that tests the component for the searched one, returns true if the component is the searched
 * @return a list of the found components
 */
export const findComponentRecursively = (component: any, isComponent: (any) => boolean) => {

    // no component, nothing to return
    if (component === undefined) {
        return [];
    }

    // when we have an array, we search each component separately and concat the results
    if (Array.isArray(component) && component.length > 0) {
        //console.log("component is array: ", component)
        return component.reduce((res, c) => res.concat(findComponentRecursively(c, isComponent)), []);
    };

    // if the component is of the searched type, we can return it
    if (isComponent(component)) {
        return [component]
    };
    
    // finally, search the children
    return findComponentRecursively(component.children, isComponent).filter(
        // // if the component insulates the searched Type, do not return it
        child => component.insulatesChildComponent === undefined || !component.insulatesChildComponent(child)
    );

};