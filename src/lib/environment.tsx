import * as React from 'react';

export interface IEnvironment {
    /**
     * The name of the environment is mandatory. in the cloud, this is also used as stagePath
     */
    name: string,

    /**
     * the domain that this page should be deployed to
     */
    domain?: string,

    /**
     * The used port when running offline
     */
    offlinePort?: number
}

/*
export class Environment extends React.Component<IEnvironment, {}> {

    constructor(props) {
        super(props);
    }

    render () {
        return null;
    }
}

export default Environment;
*/


export default (props: IEnvironment | any) => {

    // execute during runtime, here we can use objects!
    /*if (props.infrastructureMode === "component") {
        return {

        }
    };*/

    if (process.env.ENVIRONMENT !== props.name) {
        console.log(`environment ${props.name} does not apply to specified ${process.env.ENVIRONMENT}`);
        return {}
    }


    // this part is loaded on compilation and MUST NOT contain any dependencies
    return Object.assign({}, props,
        {
            infrastructureType: "environment",
            slsConfig: {
                provider: {
                    STAGE: props.name
                }
            }
        },
        props.offlinePort !== undefined ? {
            slsConfig: {
                provider: {
                    PORT: props.offlinePort
                }
            }
        } : {},
        props.stagePath !== undefined ? {
            slsConfig: {
                provider: {
                    STAGE_PATH: props.stagePath
                }
            }
        } : {}
    );


};