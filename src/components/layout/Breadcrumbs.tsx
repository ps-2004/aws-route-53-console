import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex items-center text-xs text-[#545b64] py-2 mb-2 select-none" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-[#879596] shrink-0" />
            )}
            {item.onClick && !isLast ? (
              <button
                onClick={item.onClick}
                className="hover:text-[#0073bb] hover:underline focus:outline-none transition-colors truncate max-w-[200px]"
              >
                {item.label}
              </button>
            ) : (
              <span className={`truncate max-w-[240px] ${isLast ? 'text-[#16191f] font-medium' : ''}`}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
