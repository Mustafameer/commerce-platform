import * as React from 'react';

const ThemeContext = React.createContext<{ isDarkMode: boolean; setIsDarkMode: (value: boolean) => void }>({
  isDarkMode: true,
  setIsDarkMode: () => {},
});

export const useTheme = () => React.useContext(ThemeContext);

export const ThemeProvider = ({
  children,
  isDarkMode,
  setIsDarkMode,
}: {
  children: React.ReactNode;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}) => {
  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};