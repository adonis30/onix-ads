import { FaWpforms } from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

// -----------------------------
// SINGLE FORM CARD COMPONENT
// -----------------------------
export default function FormCard({ form }: { form: any }) {
  return (
    <Card className="bg-gray-800 border border-gray-700 hover:border-blue-500 transition-all duration-200 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <span className="truncate">{form.name}</span>
          <FaWpforms className="text-blue-400" />
        </CardTitle>
      </CardHeader>
      <CardContent className="text-gray-300 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Submissions:</span>
          <span className="font-semibold">{form.submissions ?? 0}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Views:</span>
          <span className="font-semibold">{form.views ?? 0}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Status:</span>
          <span
            className={`font-semibold ${
              form.isActive ? "text-green-400" : "text-red-400"
            }`}
          >
            {form.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="pt-2">
          <button className="w-full mt-2 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition">
            View Details
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
