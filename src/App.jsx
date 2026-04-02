import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Layout from './Layout.jsx';
import UploadPage from './pages/UploadPage.jsx';
import ValidationPage from './pages/ValidationPage.jsx';
import ResultPage from './pages/ResultPage.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <UploadPage /> },
      { path: 'dogrulama', element: <ValidationPage /> },
      { path: 'sonuc', element: <ResultPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
