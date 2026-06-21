-- Verification: expect 24 categories, each with count >= 5 and distinct_cities >= 5
SELECT
  regexp_replace(title, '^.* - ', '') AS category,
  COUNT(*) AS job_count,
  COUNT(DISTINCT location) AS distinct_cities,
  string_agg(DISTINCT location, ', ' ORDER BY location) AS cities
FROM jobs
WHERE status = 'ACTIVE'
  AND title ~ ' - (Construction|Electrical|Welding|Plumbing|HVAC|Manufacturing|Carpentry|Painting|Masonry|Steel Fixing|Scaffolding|Heavy Equipment Operation|Crane Operation|Delivery & Logistics|Hospitality|Healthcare|IT & Technology|Engineering|Security|Cleaning & Maintenance|Food & Beverage|Agriculture|Oil & Gas|Mining)$'
GROUP BY 1
ORDER BY 1;
