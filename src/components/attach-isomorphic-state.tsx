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
        return <IsomorphicStateContext.Provider value={{
            preloadedState: props.preloadedState
        }}>{props.children}</IsomorphicStateContext.Provider>

    } else {

        //at the server, we provide a callback function that sets the preloadedState
        return <IsomorphicStateContext.Provider value={{
            setServerValue: props.setServerValue,
            preloadedState: props.preloadedState
        }}>{props.children}</IsomorphicStateContext.Provider>
    }



};

export function withIsomorphicState(Component) {

    return function WrapperComponent(props) {

        return (
            <IsomorphicStateContext.Consumer>
                {(value: any) => {

                    //console.log("IsomorphicStateContext preloadedState: ", value.preloadedState);

                    if (ExecutionEnvironment.canUseDOM) {


                        //const [clientValue, clientSetter] = useState(value);
                        // we ignore the clientProps...but we take the props from the preloadedState!
                        return <Component {...props} useIsomorphicState={(id, initialValue) => useState( value.preloadedState? value.preloadedState[id]:undefined)} />

                    } else {

                        const useServerState = (id, intialValue) => {
                            //console.log("useServerState: ", id, " -> ", intialValue);
                            if (value.setServerValue) {
                                value.setServerValue(
                                    id,
                                    value.preloadedState && value.preloadedState[id] ? value.preloadedState[id]: intialValue,
                                    true);
                            };

                            const [serverValue, setValue] = useState(
                                value.preloadedState && value.preloadedState[id] ? value.preloadedState[id]:intialValue
                            );

                            const setServerValue = (newValue) => {

                                // "value" is the function "setServerValue" from the Context
                                if (value.setServerValue) {
                                    value.setServerValue(id, newValue);
                                }

                                // the normal hook setter
                                setValue(newValue);
                            }

                            //console.log("serverValue: ", serverValue);
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




