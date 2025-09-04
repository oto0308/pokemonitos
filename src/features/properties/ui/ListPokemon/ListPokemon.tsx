import { useEffect, useState } from "react";
import './ListPokemon.css'
function ListPokemon(){
    const loadPokemons = usePokemonsStore((state) => state.loadPokemons);

    const [sortedProperties, setSortedProperties] = useState<Property[]>([]);

    useEffect(()=>{
        loadPokemons()
    },[]);

    return(
        <div className="property-grid-container"> 
            <h1>Pokemons</h1>
            <div className="property-grid">
                {sortedProperties.map((property: Property) => (
                    <PropertyCard 
                        key={property.id}
                        {...property}
                    />
                ))}
            </div>
        </div>
    )
}

export default PokemonList