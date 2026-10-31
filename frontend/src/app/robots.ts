import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/status',
          '/login',
          '/register',
          '/incidents',
          '/maintenance',
        ],
        disallow: [
          '/dashboard',
          '/dashbard',
          '/api/',
          '/_next/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/dashboard', '/dashbard', '/api/'],
      },
    ],
    sitemap: 'https://sentiro.xyz/sitemap.xml',
    host: 'https://sentiro.xyz',
  };
}
