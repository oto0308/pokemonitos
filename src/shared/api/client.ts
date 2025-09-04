import axios from 'axios';
import axiosRetry from 'axios-retry';
import Logger from '../lib/logger';

const API_BASE_URL = 'https://pokeapi.co/api/v2/';
const myLogger = new Logger();

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // 10 segundos
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    }
});

axiosRetry(apiClient, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
        return error.response?.status === 500;
    },
});

apiClient.interceptors.request.use(
    (config) => {
        myLogger.info(config.url || '')
        return config;
    }
)

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        myLogger.error(error);
        return Promise.reject(error);
    }
)

/* =========================
 *  CACHÉ DE SOLICITUDES
 * ========================= */

//Time to Live tiempo en que una respuesta se considera válida antes de caducar
export const TTL = {
    SHORT: 60_000,        // 1 min
    MEDIUM: 5 * 60_000,   // 5 min
    LONG: 30 * 60_000,    // 30 min
};

let defaultTTL = TTL.MEDIUM; //Definimos un TTL de 5 minutos por defecto

// Estructuras en memoria
const cache = new Map();    // key -> { data, expiresAt } caché utilzado para almacenar las respuestas, ejemplo { data: ..., expiresAt: 1234567890 }    
const inFlight = new Map(); // key -> Promise inFLight utilizado para almacenar las solicitudes en curso, ejmplo key -> Promise

// Genera una clave única para cada solicitud basada en URL y parámetros
// parametro config: { url, params, method, data }
function keyFrom(config: { url: any; params?: Record<string, any> }) {
  const base = apiClient.defaults.baseURL || '';
  const url = new URL(config.url || '', base);
  const params = config.params || {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });
  return url.toString();
}

/**
 * requestWithCache:
 *  - GET por defecto (pero respeta method si lo pasas)
 *  - TTL: ms (0 = sin caché) 
 *  - dedupe: evita requests concurrentes iguales
 *  - skipCache: fuerza ir a red e ignorar cache
 *  - validate: función opcional para validar la respuesta
 * 
 *  - ejemplo:
 *    const data = await requestWithCache(
 *      { url: '/pokemon/1' },
 *      { ttlMs: TTL.MEDIUM, dedupe: true, validate: (d) => d && d.id && typeof d.name === 'string' }
 *    );
 */
type RequestWithCacheOptions = {
  ttlMs?: number;
  dedupe?: boolean;
  skipCache?: boolean;
  validate?: (data: any) => boolean;
};

/**
 * Esta función realiza una solicitud HTTP con caché y deduplicación.
 * Utiliza axios para hacer la solicitud y almacena en caché las respuestas
 * 
 * @param config configuración de la solicitud (url, params, method, data)
 * @param param1 opciones para controlar la caché y el comportamiento de la solicitud
 * @returns reotrna una promesa que se resuelve con los datos de la respuesta
 */
export async function requestWithCache(
  config: { url: string; params?: { limit: number; offset: number; }; },
  {
    ttlMs = defaultTTL,
    dedupe = true,
    skipCache = false,
    validate, // (data) => boolean
  }: RequestWithCacheOptions = {}
) {
  const finalConfig = { method: 'GET', ...config };

  // Solo tiene sentido cachear GET idempotentes
  const cacheable = (finalConfig.method || 'GET').toUpperCase() === 'GET';
  const key = cacheable ? keyFrom(finalConfig) : undefined; //El error esta aquí
  const now = Date.now();

  if (cacheable && !skipCache && ttlMs > 0) {
    const cached = key ? cache.get(key) : null;
    if (cached && cached.expiresAt > now) {
      return cached.data; // Hit de caché
    }
  }

  // Manejo de solicitudes en vuelo para evitar duplicados
  if (cacheable && dedupe && key && inFlight.has(key)) {
    return inFlight.get(key); // Reutiliza la promesa en vuelo
  }

  /**
   * Realiza la solicitud de red y maneja la caché
   * @return Promise que se resuelve con los datos de la respuesta
   * @throws Error si la respuesta no es válida o la solicitud falla
   * @private esta función es interna y no debe ser llamada directamente
   */
  const promise = (async () => {
    try {
      const res = await apiClient(finalConfig);
      const data = res.data;

      if (typeof validate === 'function') {
        const ok = !!validate(data);
        if (!ok) {
          // No cachees respuestas inválidas
          throw new Error('INVALID_RESPONSE_STRUCTURE');
        }
      }

      if (cacheable && ttlMs > 0 && key) {
        cache.set(key, { data, expiresAt: now + ttlMs });
      }
      return data;
    } finally {
      if (cacheable && key) inFlight.delete(key);
    }
  })();

  if (cacheable && key) inFlight.set(key, promise);
  return promise;
}

/**
 * Endpoints:
 *  - GET /pokemon/{name-or-id}
 *  - GET /pokemon?limit=151&offset=0
 *  - GET /pokemon-species/{id}
 */


/**
 * Este metodo obtiene los datos de un Pokémon por su nombre o ID.
 * El parametro opts es opcional y permite configurar el comportamiento de la caché
 * 
 * retorna una promesa que se resuelve con los datos del Pokémon o se rechaza con un error
 * 
 * @param nameOrId parametro obligatorio, puede ser el nombre (string) o ID (número) del Pokémon
 * @param opts parametros opcionales para configurar la caché
 * @returns retorna una promesa que se resuelve con los datos del Pokémon o se rechaza con un error
 * 
 * ejemplo de uso:
 *   const pikachu = await getPokemon('pikachu', { ttlMs: TTL.MEDIUM, dedupe: true });
 */

export function getPokemon(nameOrId: any, opts: { ttlMs?: number | undefined; dedupe?: boolean | undefined; skipCache?: boolean | undefined; } | undefined) {
  if (!nameOrId || String(nameOrId).trim() === '') {
    return Promise.reject(new Error('nameOrId es obligatorio'));
  }
  const normalized = String(nameOrId).trim().toLowerCase();
  return requestWithCache(
    { url: `/pokemon/${encodeURIComponent(normalized)}` },
    { ttlMs: TTL.MEDIUM, ...opts, validate: (d) => d && d.id && typeof d.name === 'string' }
  );
}

/**
 * Este metodo obtiene la lista de los primeros 151 pokemones.
 * 
 * @param opts parametros opcionales para configurar la caché
 * @returns retorna una promesa que se resuelve con la lista de los primeros 151 pokemones o se rechaza con un error
 * 
 * ejemplo de uso:
 *      const list = await getPokemonList({ limit: 151, offset: 0 }, { ttlMs: TTL.LONG, dedupe: true });
 *      dato que opts es opcional podrias usarlo asi, solo con params:
 *      const list = await getPokemonList({ limit: 151, offset: 0 }); * 
 * 
    *
 */
export function getPokemonList(params:{limit: number, offset: number}, opts?: { ttlMs?: number; dedupe?: boolean; skipCache?: boolean }) {
  return requestWithCache(
    { url: '/pokemon', ...params},
    { ttlMs: TTL.LONG, ...opts, validate: (d) => d && Array.isArray(d.results) }
  );
}

/**
 * Este metodo obtiene los datos de la especie de un Pokémon por su ID numérico.
 *  
 * @param id identificador numérico del Pokémon (debe ser positivo)
 * @param opts opciones para configurar la caché 
 * @returns retorna una promesa que se resuelve con los datos de la especie del Pokémon o se rechaza con un error
 * 
 * ejemplo de uso:
 *  const species = await getPokemonSpecies(25. { ttlMs: TTL.LONG, depupe: true });
 *  respuesta esperada:
 *  {
 *    id: 25,
 *    name: "pikachu",
 *    ...
 *  }
 */
export function getPokemonSpecies(id: any, opts: RequestWithCacheOptions | undefined) {
  const num = Number(id);
  if (!Number.isFinite(num) || num <= 0) {
    return Promise.reject(new Error('id debe ser un número positivo'));
  }
  return requestWithCache(
    { url: `/pokemon-species/${num}` },
    { ttlMs: TTL.LONG, ...opts, validate: (d) => d && d.id && typeof d.name === 'string' }
  );
}

/* =========================
 *  UTILIDADES DE CACHÉ
 * ========================= */

//Esto podria ir en otro archivo si se quiere separar responsabilidades

//esta funcion limpia toda la caché
export function clearRequestCache() {
  cache.clear();
}

//esta funcion elimina una entrada específica de la caché basada en la URL con query
export function deleteFromRequestCache(pathWithQuery: string | URL) {
  const base = apiClient.defaults.baseURL || '';
  const url = new URL(pathWithQuery, base).toString();
  cache.delete(url);
}

//esta funcion permite configurar el TTL por defecto para las solicitudes
export function setDefaultRequestTTL(ms: number) {
  if (Number.isFinite(ms) && ms >= 0) defaultTTL = ms;
}