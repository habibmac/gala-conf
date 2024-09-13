import { defineEventHandler, getQuery } from 'h3'
import Typesense from 'typesense'

// Define the interface for our city document
interface CityDocument {
  id: string;
  name: string;
  state_name: string;
  country_name: string;
}

// Define the CityOption interface
interface CityOption {
  city: string;
  state: string;
  country: string;
  id: string;
}

export default defineEventHandler(async (event) => {

  const config = useRuntimeConfig()

  // Initialize Typesense client
  const typesense = new Typesense.Client({
    nodes: [
      {
        host: config.typesenseHost,
        port: Number(config.typesensePort),
        protocol: config.typesenseProtocol
      }
    ],
    apiKey: config.typesenseApiKey,
    connectionTimeoutSeconds: 2
  })

  const query = getQuery(event)
  const cityQuery = query.city as string

  if (!cityQuery || cityQuery.length < 3) {
    return []
  }

  try {
    const searchParameters = {
      q: cityQuery,
      query_by: 'name',
      filter_by: 'country_code:!=XX',  // Exclude any entries with invalid country codes
      sort_by: '_text_match:desc',
      limit: 10
    }

    const searchResults = await typesense
      .collections('cities')
      .documents()
      .search(searchParameters)

    return (searchResults.hits as any[])?.map((hit) => ({
      city: hit.document.name,
      state: hit.document.state_name,
      country: hit.document.country_name,
      country_code: hit.document.country_code,
      id: hit.document.id
    } as CityOption)) || []
  } catch (error) {
    console.error('Error searching cities:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error searching cities'
    })
  }
})