import { Helmet } from 'react-helmet-async';
import { PageMeta, generateMetaTags, getOrganizationSchema, HREFLANG_LOCALES } from '@/lib/seo';

interface SEOHeadProps {
  meta: PageMeta;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
}

export function SEOHead({ meta, structuredData }: SEOHeadProps) {
  const tags = generateMetaTags(meta);
  const baseUrl = 'https://www.shadowtalk-ai.com';
  const canonical = meta.canonical || baseUrl;
  const structuredDataItems = structuredData
    ? Array.isArray(structuredData)
      ? structuredData
      : [structuredData]
    : [];

  // Derive path for hreflang alternates (append ?hl=xx so localized crawlers can index)
  let canonicalPath = '';
  try {
    canonicalPath = new URL(canonical).pathname;
  } catch {
    canonicalPath = '/';
  }

   return (
     <Helmet>
       {/* Primary Meta Tags */}
       <title>{tags.title}</title>
       <meta name="description" content={tags.description} />
       {tags.keywords && <meta name="keywords" content={tags.keywords} />}
       <meta name="robots" content={tags.robots} />
       <link rel="canonical" href={canonical} />
       <link rel="alternate" type="text/plain" href={`${baseUrl}/llms.txt`} title="ShadowTalk AI llms.txt" />
       <link rel="alternate" type="application/json" href={`${baseUrl}/shadowtalk.json`} title="ShadowTalk AI facts JSON" />

       {/* Hreflang alternates for 11 supported languages */}
       {HREFLANG_LOCALES.map((loc) => (
         <link
           key={loc.code}
           rel="alternate"
           hrefLang={loc.code}
           href={`${baseUrl}${canonicalPath}${canonicalPath.includes('?') ? '&' : '?'}hl=${loc.code}`}
         />
       ))}
       <link rel="alternate" hrefLang="x-default" href={canonical} />

 
       {/* Open Graph */}
       <meta property="og:type" content={tags['og:type']} />
       <meta property="og:title" content={tags['og:title']} />
       <meta property="og:description" content={tags['og:description']} />
       <meta property="og:image" content={tags['og:image']} />
       <meta property="og:url" content={tags['og:url']} />
       <meta property="og:site_name" content="ShadowTalk AI" />
 
       {/* Twitter */}
       <meta name="twitter:card" content={tags['twitter:card']} />
       <meta name="twitter:title" content={tags['twitter:title']} />
       <meta name="twitter:description" content={tags['twitter:description']} />
       <meta name="twitter:image" content={tags['twitter:image']} />
       <link rel="me" href="https://www.linkedin.com/in/zain-ahmed-917b6b3a6" />
       <link rel="me" href="https://www.instagram.com/shadowtalk_ai" />
 
       {/* Structured Data */}
       <script type="application/ld+json">
         {JSON.stringify(getOrganizationSchema())}
       </script>
      {structuredDataItems.map((item, index) => (
        <script key={`structured-data-${index}`} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
     </Helmet>
   );
 }
 
 export default SEOHead;