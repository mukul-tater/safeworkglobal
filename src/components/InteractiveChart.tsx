import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

interface InteractiveChartProps {
  title: string;
  type: 'line' | 'bar';
  data: any[];
  dataKeys: { key: string; color: string; name: string }[];
}

export default function InteractiveChart({ title, type, data, dataKeys }: InteractiveChartProps) {
  const [timePeriod, setTimePeriod] = useState("6months");
  const [activeDataKey, setActiveDataKey] = useState<string | null>(null);

  const filterDataByPeriod = (data: any[]) => {
    const periodMap: { [key: string]: number } = {
      "1month": 1,
      "3months": 3,
      "6months": 6,
      "1year": 12,
      "all": data.length
    };
    
    const months = periodMap[timePeriod] || 6;
    return data.slice(-months);
  };

  const filteredData = filterDataByPeriod(data);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-3 shadow-lg border-primary/20">
          <p className="font-semibold text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-semibold">{entry.value}</span>
            </div>
          ))}
        </Card>
      );
    }
    return null;
  };

  const handleLegendClick = (dataKey: string) => {
    setActiveDataKey(activeDataKey === dataKey ? null : dataKey);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Select value={timePeriod} onValueChange={setTimePeriod}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">Last Month</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">Last Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        {type === 'line' ? (
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              width={36}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              onClick={(e: any) => handleLegendClick(String(e.dataKey))}
              wrapperStyle={{ cursor: 'pointer' }}
            />
            {dataKeys.map((item) => (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                stroke={item.color}
                strokeWidth={2}
                name={item.name}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                hide={activeDataKey !== null && activeDataKey !== item.key}
                className="transition-all duration-300"
              />
            ))}
          </LineChart>
        ) : (
          <BarChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              width={36}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              onClick={(e: any) => handleLegendClick(String(e.dataKey))}
              wrapperStyle={{ cursor: 'pointer' }}
            />
            {dataKeys.map((item) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                fill={item.color}
                name={item.name}
                hide={activeDataKey !== null && activeDataKey !== item.key}
                className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                radius={[8, 8, 0, 0]}
              />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-2 justify-center">
        {dataKeys.map((item) => (
          <button
            key={item.key}
            onClick={() => handleLegendClick(item.key)}
            className={`px-3 py-1 text-xs rounded-full border transition-all ${
              activeDataKey === null || activeDataKey === item.key
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-muted border-muted-foreground/20 text-muted-foreground'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}
