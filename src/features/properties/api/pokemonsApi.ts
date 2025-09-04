import { apiClient } from "../../../shared/api/client";

export class PokemonsApi {
    static async getPokemonList(params: { limit: number; offset: number }) {
        const response = await apiClient.get('/pokemon', { params });
        return response.data;
    } 
    
    static async getPokemonByNameOrId(nameOrId: string | number) {
        const response = await apiClient.get(`/pokemon/${nameOrId}`);
        return response.data;
    }

    static async getPokemonSpeciesById(id: number) {
        const response = await apiClient.get(`/pokemon-species/${id}`);
        return response.data;
    }

}