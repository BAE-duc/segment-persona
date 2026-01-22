import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProductSelectionPage from './pages/ProductSelectionPage';
import { SegmentCreationPage } from './pages/SegmentCreationPage';
import { SegmentPersonaListPage } from './pages/SegmentPersonaListPage';
import { ProductPersonaListPage } from './pages/ProductPersonaListPage';

const basePath = (import.meta as any).env && (import.meta as any).env.BASE_URL && (import.meta as any).env.BASE_URL !== '/'
  ? (import.meta as any).env.BASE_URL
  : '/i-map';

function App() {
  useEffect(() => {
    const handlePointerDown = () => {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'IFRAME_FOCUS' }, '*');
      }
    };

    window.addEventListener('pointerdown', handlePointerDown, true);
    return () => window.removeEventListener('pointerdown', handlePointerDown, true);
  }, []);

  return (
    <BrowserRouter basename={basePath}>
      <Routes>
        <Route path="/" element={<ProductSelectionPage />} />
        <Route path="/segment" element={<SegmentCreationPage />} />
        <Route path="/SegmentPersona" element={<SegmentPersonaListPage />} />
        <Route path="/segmentpersona" element={<SegmentPersonaListPage />} />
        <Route path="/ProductPersona" element={<ProductPersonaListPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;