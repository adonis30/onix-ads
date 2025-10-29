import { LuView } from "react-icons/lu";
import { FaWpforms } from "react-icons/fa";
import { HiCursorClick } from "react-icons/hi";
import { TbArrowBounce } from "react-icons/tb";
import StatsCard from "./StatsCard";

interface FormStats {
  visits: number;
  submissions: number;
  conversionRate: number;
  bounceRate: number;
}

// -----------------------------
// CARD GRID WRAPPER
// -----------------------------
export default function StatsCards({ stats, loading }: { stats: FormStats; loading: boolean }) {
  const cards = [
    {
      title: "Total Visits",
      value: stats.visits.toString(),
      helperText: "All-time visits",
      icon: <LuView className="text-blue-500" />,
      className: "shadow-md shadow-blue-200/50",
    },
    {
      title: "Total Submissions",
      value: stats.submissions.toString(),
      helperText: "All-time submissions",
      icon: <FaWpforms className="text-green-500" />,
      className: "shadow-md shadow-green-200/50",
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversionRate}%`,
      helperText: "Submissions ÷ Visits × 100",
      icon: <HiCursorClick className="text-yellow-500" />,
      className: "shadow-md shadow-yellow-200/50",
    },
    {
      title: "Bounce Rate",
      value: `${stats.bounceRate}%`,
      helperText: "Visits without submission",
      icon: <TbArrowBounce className="text-red-500" />,
      className: "shadow-md shadow-red-200/50",
    },
  ];

  return (
    <div className="w-full pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <StatsCard key={i} {...card} loading={loading} />
      ))}
    </div>
  );
}
