import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
// -----------------------------
// INDIVIDUAL CARD COMPONENT
// -----------------------------
export default function StatsCard({
  title,
  icon,
  helperText,
  value,
  loading,
  className,
}: {
  title: string;
  icon: React.ReactNode;
  helperText: string;
  value: string;
  loading: boolean;
  className?: string;
}) {
  return (
    <Card className={`p-4 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-300">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">
          {loading ? <Skeleton className="h-6 w-16" /> : value}
        </div>
        <p className="text-xs text-gray-400 pt-1">{helperText}</p>
      </CardContent>
    </Card>
  );
}