import { defineEventHandler, getQuery } from 'h3';
import Typesense from 'typesense';

// Define the interface for our city document
interface CityDocument {
  id: string
  name: string
  state_name: string
  country_name: string
}

// Define the CityOption interface
interface CityOption {
  city: string
  state: string
  country: string
  id: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  // Initialize Typesense client
  const typesense = new Typesense.Client({
    apiKey: config.typesenseApiKey,
    connectionTimeoutSeconds: 2,
    nodes: [
      {
        host: config.typesenseHost,
        port: Number(config.typesensePort),
        protocol: config.typesenseProtocol,
      },
    ],
  });

  const query = getQuery(event);
  const cityQuery = query.city as string;

  if (!cityQuery || cityQuery.length < 3) {
    return [];
  }

  try {
    const searchParameters = {
      filter_by: 'country_code:!=XX', // Exclude any entries with invalid country codes
      limit: 10,
      q: cityQuery,
      query_by: 'name',
      sort_by: '_text_match:desc',
    };

    const searchResults = await typesense.collections('cities').documents().search(searchParameters);

    if (!searchResults || !searchResults.hits) {
      return [];
    }

    const cities: CityOption[] = searchResults.hits.map((hit) => {
      const city = hit.document as CityDocument;
      return {
        city: city.name,
        country: city.country_name,
        id: city.id,
        state: city.state_name,
      };
    });
    return cities;
  }
  catch (error) {
    return error;
  }
});
