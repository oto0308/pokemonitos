import React from 'react';
import './SearchInput.css';
import { useSearch } from '../../../../shared/hooks/useSearch';

function SearchInput() {
    const {
        input,
        setInput,
        error,
        suggestions,
        history,
        addToHistory,
      } = useSearch();
    
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
      };
    
      const clearInput = () => {
        setInput('');
      };
    
      const handleSelect = (term: string) => {
        setInput(term);
        addToHistory(term);
      };
    
      return (
        <div>
          <div>
            <input
              type="text"
              placeholder="Buscar..."
              value={input}
              onChange={handleChange}
              autoComplete="off"
            />
            {input && (
              <button
                onClick={clearInput}
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>
    
          {error && <p>{error}</p>}
    
          {!error && suggestions.length > 0 && (
            <ul>
              {suggestions.map((item: string, idx: number) => (
                <li
                  key={idx}
                  onClick={() => handleSelect(item)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelect(item)}
                >
                  {item}
                </li>
              ))}
            </ul>
          )}
    
          {!error && input && suggestions.length === 0 && (
            <p>Sin resultados</p>
          )}
    
          {history.length > 0 && (
            <div>
              <h2>Historial reciente</h2>
              <ul>
                {history.map((item: string, idx: number) => (
                  <li
                    key={idx}
                    onClick={() => handleSelect(item)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelect(item)}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
}

export default SearchInput;