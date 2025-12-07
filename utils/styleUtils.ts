export const getTypeStyle = (type: string) => {
  const t = type.toLowerCase().trim();
  if (t === 'n' || t.startsWith('noun')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  if (t === 'v' || t.startsWith('verb')) return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800';
  if (t === 'adj' || t.startsWith('adject')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  if (t === 'adv' || t.startsWith('adverb')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800';
  if (t === 'prep' || t.startsWith('prepos')) return 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300 border-pink-200 dark:border-pink-800';
  
  return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
};
