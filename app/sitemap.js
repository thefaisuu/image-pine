import { routeMap } from '@/lib/routes';

export default async function sitemap() {
  const baseUrl = 'https://www.imagepine.com';

  // Extract all unique paths starting with '/' from the centralized routeMap
  const routes = Array.from(new Set(Object.values(routeMap)))
    .filter((path) => typeof path === 'string' && path.startsWith('/'))
    .map((path) => path.trim());

  // Add the base homepage path
  const paths = ['', ...routes];

  return paths.map((path) => {
    // Define priorities dynamically based on importance
    let priority = 0.8;
    let changeFrequency = 'weekly';

    if (path === '') {
      priority = 1.0;
      changeFrequency = 'daily';
    } else if (['/contact', '/privacy', '/terms'].includes(path)) {
      priority = 0.5;
      changeFrequency = 'monthly';
    }

    return {
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    };
  });
}
