import { z } from 'zod';

// Item individual de la lista
export const PokemonListItemSchema = z.object({
  name: z.string().min(1, { message: "El nombre es requerido" }),
  url: z.string().url({ message: "La URL del Pokémon debe ser válida" }),
});

export type PokemonListItem = z.infer<typeof PokemonListItemSchema>;

export const PropertyList = z.object({
    count: z.number().int().nonnegative({ message: "count debe ser un entero >= 0" }),
    next: z.string().url().nullable(),      // puede ser string o null
    previous: z.string().url().nullable(),  // puede ser string o null
    results: z.array(PokemonListItemSchema).min(1, {
        message: "results debe contener al menos un elemento",
    }),

});

export type Property = z.infer<typeof PropertyList>;