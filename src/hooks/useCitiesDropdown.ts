import { useState, useCallback, useEffect, useRef } from 'react';
import debounce from 'lodash/debounce';

interface CityOption {
  value: string;
  label: string;
}

interface CountryData {
  country: string;
  cities: string[];
}

const PAGE_SIZE = 50;

// Full-featured hook with pagination and initial load (used by Add Applicant)
export const useCountriesNowCitiesDropdown = () => {
  const [allCities, setAllCities] = useState<string[]>([]);
  const [options, setOptions] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Fetch all cities on mount
  useEffect(() => {
    setLoading(true);
    fetch('https://countriesnowapi-4x2g.onrender.com/api/v0.1/countries')
      .then(res => res.json())
      .then((data: { data: CountryData[] }) => {
        if (data && data.data) {
          const cities: string[] = data.data.flatMap(
            (country: CountryData) => country.cities || []
          );
          const uniqueCities: string[] = Array.from(new Set(cities)).sort();
          setAllCities(uniqueCities);
        } else {
          setAllCities([]);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch cities');
        setLoading(false);
      });
  }, []);

  // Update options whenever searchTerm, page, or allCities changes
  useEffect(() => {
    setLoading(true);
    let filtered: string[] = allCities;
    if (searchTerm) {
      filtered = allCities.filter((city: string) =>
        city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // Always show only PAGE_SIZE * page results, even for search
    const paginated = filtered.slice(0, page * PAGE_SIZE);
    setOptions(paginated.map((city: string) => ({ value: city, label: city })));
    setLoading(false);
  }, [searchTerm, page, allCities]);

  // Debounced search handler
  const debouncedSearch = useRef(
    debounce((inputValue: string) => {
      setSearchTerm(inputValue);
      setPage(1); // Reset to first page on new search
    }, 400)
  ).current;

  // Search handler (with debounce)
  const search = (inputValue: string) => {
    debouncedSearch(inputValue);
  };

  // Pagination handler
  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  // Only allow loading more if there are more filtered results
  const filtered = allCities.filter((city: string) =>
    city.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return {
    options,
    loading,
    error,
    search,
    loadMore,
    hasMore: options.length < filtered.length,
  };
};

// Simple search-only hook (legacy)
export const useCitiesDropdown = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch cities from countriesnow.space API
  const fetchCities = async (search: string) => {
    if (!search.trim()) {
      setOptions([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://countriesnowapi-4x2g.onrender.com/api/v0.1/countries');
      const data = await response.json();
      
      if (!data.data) {
        throw new Error('Failed to fetch city data');
      }
      
      // Collect all cities from all countries
      const allCities: string[] = [];
      data.data.forEach((country: any) => {
        if (country.cities && Array.isArray(country.cities)) {
          allCities.push(...country.cities);
        }
      });
      
      // Filter cities based on search term
      const filteredCities = allCities.filter(city => 
        city.toLowerCase().includes(search.toLowerCase())
      );
      
      // Remove duplicates and create options
      const uniqueCities = filteredCities.filter((city, index, self) => 
        self.indexOf(city) === index
      );
      const cityOptions = uniqueCities.map(city => ({
        value: city,
        label: city
      }));
      
      setOptions(cityOptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cities');
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (search: string) => {
      await fetchCities(search);
    }, 400),
    []
  );

  // Search function to be called from components
  const search = useCallback((term: string) => {
    setSearchTerm(term);
    debouncedSearch(term);
  }, [debouncedSearch]);

  return {
    options,
    loading,
    error,
    search,
    searchTerm
  };
};