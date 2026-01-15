import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProductSelectionPage from './pages/ProductSelectionPage';
import { SegmentCreationPage } from './pages/SegmentCreationPage';
import { SegmentPersonaListPage } from './pages/SegmentPersonaListPage';
import { ProductPersonaListPage } from './pages/ProductPersonaListPage';

const basePath = (import.meta as any).env && (import.meta as any).env.BASE_URL && (import.meta as any).env.BASE_URL !== '/'
  ? (import.meta as any).env.BASE_URL
  : '/i-map';

function App() {
  return (
    <BrowserRouter basename={basePath}>
      <Routes>
        <Route path="/" element={<ProductSelectionPage />} />
        <Route path="/segment" element={<SegmentCreationPage />} />
        <Route path="/SegmentPersona" element={<SegmentPersonaListPage />} />
        <Route path="/ProductPersona" element={<ProductPersonaListPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;