// // app/layout.tsx
// import '../styles/globals.css';
// import { Toaster } from 'react-hot-toast';
// export const metadata = {
//   title: 'My App',
//   description: 'My awesome app',
// };

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en">
//       <body className="bg-gray-50">{children}</body>
//     </html>
//   );
// }
// app/layout.tsx
// import '../styles/globals.css';
// import 'leaflet/dist/leaflet.css';
// import { Toaster } from 'react-hot-toast';

// export const metadata = {
//   title: 'My App',
//   description: 'My awesome app',
// };

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en">
//       <body className="bg-gray-50">
//         <Toaster position="top-right" /> {/* ✅ Add this */}
//         {children}
//       </body>
//     </html>
//   );
// }

import '../styles/globals.css';
import 'leaflet/dist/leaflet.css';
import { Toaster } from 'react-hot-toast';
import Script from 'next/script'; // ✅ Import Script component

export const metadata = {
  title: 'My App',
  description: 'My awesome app',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Razorpay checkout script */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-gray-50">
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}

