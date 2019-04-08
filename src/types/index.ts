/**
 * Export the Infrastructure Types that we support
 * Each type may have certain characteristics within infrastructure-components
 */
export default {
    /**
     * The configuration is the top-level component of any infrastructure-components configuration
     * configurations define the Plugins supported in the configuration
     */
    INFRASTRUCTURE_TYPE_CONFIGURATION: "INFRASTRUCTURE_TYPE_CONFIGURATION",

    /**
     * a client produces a webpack configuration, e.g. a webapp or an API endpoint
     */
    INFRASTRUCTURE_TYPE_CLIENT: "INFRASTRUCTURE_TYPE_CLIENT",

    /**
     * A component has no special characteristics
     * what they do is completely up to their plugins
     */
    INFRASTRUCTURE_TYPE_COMPONENT: "INFRASTRUCTURE_TYPE_COMPONENT"
};

/**
 * Any Infrastructure-Component must implement this interface
 *
 * it can run in webpack-hot-middleware-mode
 * TODO extend respectively
 */
export interface IInfrastructure {

    /**
     * an infrastructure-component  must have a type, see the default export for available types
     * e.g.`Types.INFRASTRUCTURE_TYPE_CLIENT`
     */
    infrastructureType: string,

    /**
     * a unique identifier of the instance that allows finding it
     * CAUTION: this id must be the same even though it may be processed at different times!!
     */
    instanceId: string,

    /**
     * a string that identifies the specific type of infrastructure, e.g. Middleware, Route, etc.
     */
    instanceType: string,
}