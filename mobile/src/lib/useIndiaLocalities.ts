import { useEffect, useState } from 'react';
import { fetchIndiaLocalities, resolveIndiaPlace, type IndiaLocality } from './indiaLocations';

export function useIndiaLocalities(state: string, district: string) {
  const place = resolveIndiaPlace(state, district);
  const [localities, setLocalities] = useState<IndiaLocality[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!place.state || !place.district) {
      setLocalities([]);
      setLoading(false);
      setFailed(false);
      return;
    }
    let cancel = false;
    setLoading(true);
    setFailed(false);
    fetchIndiaLocalities(place.state, place.district)
      .then((rows) => {
        if (!cancel) setLocalities(rows);
      })
      .catch(() => {
        if (!cancel) {
          setLocalities([]);
          setFailed(true);
        }
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [place.state, place.district]);

  return { localities, loading, failed };
}
