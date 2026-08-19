import { Navigate, useParams } from "react-router-dom";
import { getCountryInsight } from "@/modules/country-insights";
import { CountryInsightsDetail } from "@/modules/country-insights/components/CountryInsightsDetail";

export default function CountryInsightDetailPage() {
  const { slug } = useParams();
  const country = getCountryInsight(slug);
  if (!country) return <Navigate to="/country-insights" replace />;
  return <CountryInsightsDetail country={country} />;
}
