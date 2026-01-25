import { Clock, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface ResourceCardProps {
  imageSrc?: string;
  title: string;
  description: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced" | string;
  category: string;
}

export function ResourceCard({
  imageSrc,
  title,
  description,
  duration,
  level,
  category,
}: ResourceCardProps) {
  const [imageError, setImageError] = useState(false);

  const getLevelColor = () => {
    switch (level.toLowerCase()) {
      case "beginner":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800";
      case "intermediate":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "advanced":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getCategoryColor = () => {
    switch (category.toLowerCase()) {
      case "fundamentals":
        return "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-800";
      case "technology":
        return "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800";
      case "finance":
        return "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800";
      case "security":
        return "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 border-red-100 dark:border-red-800";
      case "defi":
        return "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 border-amber-100 dark:border-amber-800";
      case "nft":
        return "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-300 border-pink-100 dark:border-pink-800";
      default:
        return "bg-muted/50 text-muted-foreground border-border";
    }
  };

  return (
    <div className="h-full flex flex-col bg-card/80 dark:bg-card/80 backdrop-blur-sm border border-border rounded-xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] group">
      <div className="relative h-44 w-full flex items-center justify-center bg-muted/50">
        {!imageError && imageSrc ? (
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
            <span className="text-sm text-muted-foreground mt-2">
              Image placeholder
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 p-5 flex flex-col">
        <div className="flex-1">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-medium text-foreground">{title}</h3>
            <span
              className={`text-xs px-2 py-1 rounded border ${getLevelColor()}`}
            >
              {level}
            </span>
          </div>

          <p className="text-sm text-muted-foreground mb-4">{description}</p>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-border">
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 mr-1" />
            {duration}
          </div>

          <span
            className={`text-xs px-2 py-1 rounded border ${getCategoryColor()}`}
          >
            {category}
          </span>
        </div>
      </div>
    </div>
  );
}
