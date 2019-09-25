declare var require: any;
import React, { useState } from 'react';
import ExecutionEnvironment from 'exenv';

const IsomorphicStateContext = React.createContext({});

interface IsomorphicStateProps {
    preloadedState?: any,
    setServerValue?: (id: string, value: any) => any,
    children: any
}

const AttachIsomorphicState = (props: IsomorphicStateProps) => {

    if (ExecutionEnvironment.canUseDOM) {

        //at the client, get the value from the preloaded state
        return <IsomorphicStateContext.Provider value={props.preloadedState}>{props.children}</IsomorphicStateContext.Provider>

    } else {

        //at the server, we provide a callback function that sets the preloadedState
        return <IsomorphicStateContext.Provider value={props.setServerValue}>{props.children}</IsomorphicStateContext.Provider>
    }



};

export function withIsomorphicState(Component) {

    return function WrapperComponent(props) {

        return (
            <IsomorphicStateContext.Consumer>
                {(value: any) => {

                    if (ExecutionEnvironment.canUseDOM) {

                        //console.log("value: ", value);
                        //const [clientValue, clientSetter] = useState(value);
                        // we ignore the clientProps...but we take the props from the preloadedState!
                        return <Component {...props} useIsomorphicState={(id, initialValue) => useState( value? value[id]:undefined)} />

                    } else {

                        const useServerState = (id, intialValue) => {
                            //console.log("initial server state: ", id, " -> ", intialValue);
                            if (value) {
                                value(id, intialValue);
                            };

                            const [serverValue, setValue] = useState(intialValue);
                            const setServerValue = (newValue) => {

                                // "value" is the function "setServerValue" from the Context
                                if (value) {
                                    value(id, newValue);
                                }

                                // the normal hook setter
                                setValue(newValue);
                            }

                            return [serverValue, setServerValue];
                        }

                        // when on the server, we use the initial value as provided
                        return <Component {...props} useIsomorphicState={useServerState} />
                    }


                }}
            </IsomorphicStateContext.Consumer>
        );
    };
}

export default AttachIsomorphicState;




