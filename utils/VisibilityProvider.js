import React, {createContext, useContext, useState} from 'react';

const VisibilityContext = createContext();

export const VisibilityProvider = ({children}) => {
    const [isPlayBarVisible, setIsPlayBarVisible] = useState(true);
    const [isNavBarVisible, setIsNavBarVisible] = useState(true);

    return (
        <VisibilityContext.Provider
            value={{isPlayBarVisible, setIsPlayBarVisible, isNavBarVisible, setIsNavBarVisible}}>
            {children}
        </VisibilityContext.Provider>
    );
};

export const useVisibility = () => useContext(VisibilityContext);
