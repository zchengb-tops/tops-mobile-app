import React, {createContext, useContext, useState} from 'react';

const VisibilityContext = createContext();

export const VisibilityProvider = ({children}) => {
    const [isVisible, setIsVisible] = useState(true);

    return (
        <VisibilityContext.Provider value={{isVisible, setIsVisible}}>
            {children}
        </VisibilityContext.Provider>
    );
};

export const useVisibility = () => useContext(VisibilityContext);
