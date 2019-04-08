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