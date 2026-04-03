import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Layout from './Layout.jsx';
import UploadPage from './pages/UploadPage.jsx';
import ValidationPage from './pages/ValidationPage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import KiraPage from './pages/KiraPage.jsx';
import BlogPage from './pages/BlogPage.jsx';
import RehberPage from './pages/RehberPage.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <UploadPage /> },
      { path: 'dogrulama', element: <ValidationPage /> },
      { path: 'sonuc', element: <ResultPage /> },
      { path: 'kira-gelir-vergisi', element: <KiraPage /> },
      { path: 'blog', element: <BlogPage /> },
      { path: 'rehber-yardim', element: <RehberPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
