import { useState, useEffect, useCallback } from 'react';
import { searchPokemon } from '../../features/properties/ui/SearchInput/searchPokemon';

const isValidInput = (value: string): boolean => /^[a-zA-Z0-9\s]*$/.test(value);

export function useSearch() {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const updateSuggestions = useCallback(async (query: string) => {
    const result = await searchPokemon(query);
    if (result) {
      setSuggestions([result]);
    } else {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    if (!input) {
      setSuggestions([]);
      setError('');
      return;
    }
    if (!isValidInput(input)) {
      setError('Solo alfanuméricos');
      setSuggestions([]);
    } else {
      setError('');
      updateSuggestions(input);
    }
  }, [input, updateSuggestions]);

  const addToHistory = (term: string) => {
    setHistory((prev: string[]) => {
      const newHistory = [term, ...prev.filter((item) => item !== term)].slice(0, 5);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  };
  
  return {
    input,
    setInput,
    error,
    suggestions,
    history,
    addToHistory,
  };
}