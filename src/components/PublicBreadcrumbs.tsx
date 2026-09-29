import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function PublicBreadcrumbs({ items }: { items: Array<{ label: string; to?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 overflow-x-auto text-sm text-muted-foreground">
      <ol className="flex min-w-max items-center gap-2">
        <li><Link to="/" aria-label="Home"><Home className="h-4 w-4" /></Link></li>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            <ChevronRight className="h-3.5 w-3.5" />
            {item.to ? <Link className="hover:text-foreground" to={item.to}>{item.label}</Link> : <span className="font-medium text-foreground">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}