export const searchPokemon = async (query: string): Promise<string | null> => {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query.toLowerCase()}`);
  
      if (!response.ok) {
        if (response.status === 404) {
          return null; 
        }
        throw new Error(`Error ${response.status}`);
      }
  
      const data = await response.json();
      return data.name;
    } catch (error) {
      console.error('Error al buscar Pokémon:', error);
      return null;
    }
  };