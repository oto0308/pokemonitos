import { useEffect, useState } from "react";
import './ListPokemon.css'
import {Card} from '../Card/Card';

function ListPokemon(){
    const loadPokemons = usePokemonsStore((state) => state.loadPokemons);
    const loading = usePropertiesStore((state) => state.loading);

    const [sortedProperties, setSortedProperties] = useState<Property[]>([]);

    useEffect(()=>{
        loadPokemons()
    },[]);

    useEffect(() => {
        setSortedProperties(properties);
    }, [properties]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return(
        <div className="property-grid-container"> 
            <h1>Pokemons</h1>
            <div className="property-grid">
                {sortedProperties.map((property: Property) => (
                    <Card 
                        key={property.id}
                        {...property}
                    />
                ))}
            </div>
        </div>
    )
}

export default PokemonList