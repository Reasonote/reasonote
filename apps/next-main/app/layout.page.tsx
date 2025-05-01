import "@/app/utils/promisePolyfills"; // Import Promise polyfills

import {RootLayout} from "../components/_APP/_baseLayout";

// export async function generateMetadata(args) {
//   // For example, use the URL path or slug as the text in your image
//   const pathName = Array.isArray(args.params.slug) ? args.params.slug.join('/') : (args.params.slug || 'home');
//   const imageUrl = generateOgImage(pathName);

//   return {
//     title: 'Dynamic OG Image Example',
//     openGraph: {
//       title: 'Dynamic OG Image Example',
//       description: 'An example page using a dynamically generated Base64 image.',
//       images: [
//         {
//           url: imageUrl,
//           width: 1200,
//           height: 630,
//           alt: 'Open Graph Dynamic Image'
//         }
//       ],
//       type: 'website'
//     }
//   };
// }

function AppLayout(props: React.ComponentProps<typeof RootLayout>) {
  return <RootLayout {...props} />;
}

export default AppLayout;