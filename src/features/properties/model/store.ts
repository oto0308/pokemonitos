import { create } from "zustand";
import { PokemonsApi } from "../api/pokemonsApi";

interface PropertiesState {
    pokemonList: any[];
    loading: boolean;
    searchTerm: string;
    loadPokemonList: (limit: number, offset: number) => Promise<void>;
    setSearchTerm: (term: string) => void;
}

export const usePropertiesStore = create<PropertiesState>((set) => ({
    pokemonList: [],
    loading: false,
    searchTerm: '',
    async loadPokemonList(limit, offset) {
        set({ loading: true });
        
        const pokemonList = await PokemonsApi.getPokemonList({ limit, offset });

        set({ pokemonList, loading: false });

    },
    setSearchTerm(term) {
        set({ searchTerm: term });
    }  
})); 

