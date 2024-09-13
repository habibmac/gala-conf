export interface City {
    name: string;
    states: {
        name: string;
    };
    countries: {
        name: string;
    };
}

export interface CityOption {
    city: string;
    state: string;
    country: string;
    country_code: string;
}
