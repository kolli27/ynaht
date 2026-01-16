import { DEFAULT_CATEGORIES } from '../../constants/categories';

interface CategoryBadgeProps {
  categoryId: string;
  size?: 'sm' | 'md';
}

export default function CategoryBadge({ categoryId, size = 'md' }: CategoryBadgeProps) {
  const category = DEFAULT_CATEGORIES.find(c => c.id === categoryId);

  if (!category) {
    return (
      <span className={`inline-flex items-center rounded-full bg-gray-100 text-gray-700 ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs'}`}>
        {categoryId}
      </span>
    );
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${category.bgColor} ${category.textColor} ${sizeClasses}`}>
      {category.name}
    </span>
  );
}
