import { createContext, useContext, useState } from 'react';

const FilterContext = createContext(null);

export function FilterProvider({ children }) {
  const [fStyles,   setFStyles]   = useState([]);
  const [fResult,   setFResult]   = useState("all");
  const [fMinGi,    setFMinGi]    = useState("");
  const [fMaxGi,    setFMaxGi]    = useState("");
  const [fGymIds,   setFGymIds]   = useState([]);
  const [fDateFrom, setFDateFrom] = useState("");
  const [fDateTo,   setFDateTo]   = useState("");

  const filterActive = fStyles.length || fResult !== "all" || fMinGi !== "" || fMaxGi !== "" || fGymIds.length || fDateFrom || fDateTo;

  const clearFilters = () => {
    setFStyles([]); setFResult("all"); setFMinGi(""); setFMaxGi("");
    setFGymIds([]); setFDateFrom(""); setFDateTo("");
  };

  return (
    <FilterContext.Provider value={{
      fStyles, setFStyles,
      fResult, setFResult,
      fMinGi,  setFMinGi,
      fMaxGi,  setFMaxGi,
      fGymIds, setFGymIds,
      fDateFrom, setFDateFrom,
      fDateTo,   setFDateTo,
      filterActive,
      clearFilters,
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export const useFilters = () => useContext(FilterContext);
