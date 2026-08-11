import React, { useState, useEffect } from 'react';

// Global cache to prevent duplicate requests and rate limiting
const geocodeCache = {};
const pendingRequests = {};

export default function LocationName({ lat, lng }) {
  const [name, setName] = useState(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);

  useEffect(() => {
    let isMounted = true;
    
    const fetchName = async () => {
      const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      
      if (geocodeCache[cacheKey]) {
        if (isMounted) setName(geocodeCache[cacheKey]);
        return;
      }

      if (pendingRequests[cacheKey]) {
        try {
          const address = await pendingRequests[cacheKey];
          if (isMounted && address) setName(address);
        } catch (err) { }
        return;
      }

      const requestPromise = (async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`);
          const data = await res.json();
          
          if (data && data.address) {
            const cityOrTown = data.address.city || data.address.town || data.address.county;
            const stateOrCountry = data.address.state || data.address.country;
            
            let address = '';
            if (cityOrTown && stateOrCountry) {
              address = `${cityOrTown}, ${stateOrCountry}`;
            } else if (data.display_name) {
              const parts = data.display_name.split(',');
              address = parts.slice(0, 2).join(',').trim();
            }
            
            if (address) {
              geocodeCache[cacheKey] = address;
              return address;
            }
          }
        } catch (err) {
          console.warn("Nominatim Geocoding failed:", err);
        }
        return null;
      })();

      pendingRequests[cacheKey] = requestPromise;

      const address = await requestPromise;
      if (isMounted && address) {
        setName(address);
      }
    };
    
    fetchName();
    
    return () => { isMounted = false; };
  }, [lat, lng]);

  return <span>{name}</span>;
}
