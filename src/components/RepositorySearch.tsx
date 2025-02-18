import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface RepositorySearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const RepositorySearch = ({ searchTerm, onSearchChange }: RepositorySearchProps) => {
  return (
    <div className="relative max-w-md mx-auto mb-8">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <Input
        type="text"
        placeholder="Search repositories..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
};
