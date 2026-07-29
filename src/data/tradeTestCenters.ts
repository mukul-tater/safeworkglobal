export type TradeTestCenter = {
  id: string;
  name: string;
  city: string;
  state: string;
  partner: string;
};

/** SafeWork Global verified physical trade test centers (demo / marketing list). */
export const TRADE_TEST_CENTERS: TradeTestCenter[] = [
  {
    id: "jaipur-bsl",
    name: "BSL Skill Assessment Centre — Jaipur",
    city: "Jaipur",
    state: "Rajasthan",
    partner: "BSL Group",
  },
  {
    id: "jodhpur-bsl",
    name: "BSL Skill Assessment Centre — Jodhpur",
    city: "Jodhpur",
    state: "Rajasthan",
    partner: "BSL Group",
  },
  {
    id: "udaipur-bsl",
    name: "BSL Skill Assessment Centre — Udaipur",
    city: "Udaipur",
    state: "Rajasthan",
    partner: "BSL Group",
  },
  {
    id: "delhi-ncr",
    name: "SafeWork Verified Trade Test — Delhi NCR",
    city: "Gurugram",
    state: "Haryana",
    partner: "BSL Group",
  },
  {
    id: "mumbai",
    name: "SafeWork Verified Trade Test — Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    partner: "BSL Group",
  },
  {
    id: "kochi",
    name: "SafeWork Verified Trade Test — Kochi",
    city: "Kochi",
    state: "Kerala",
    partner: "BSL Group",
  },
  {
    id: "hyderabad",
    name: "SafeWork Verified Trade Test — Hyderabad",
    city: "Hyderabad",
    state: "Telangana",
    partner: "BSL Group",
  },
  {
    id: "lucknow",
    name: "SafeWork Verified Trade Test — Lucknow",
    city: "Lucknow",
    state: "Uttar Pradesh",
    partner: "BSL Group",
  },
];
