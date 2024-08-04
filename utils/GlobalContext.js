import React, {createContext, useState} from 'react';

export const GlobalContext = createContext();

export const GlobalProvider = ({children}) => {
    const [globalState, setGlobalState] = useState({
        "news": {"sina": []}
    });

    return (
        <GlobalContext.Provider value={{globalState, setGlobalState}}>
            {children}
        </GlobalContext.Provider>
    );
};