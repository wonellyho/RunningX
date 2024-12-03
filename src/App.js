// src/App.js

import React from 'react';
import './App.css';
import MapContainer from './components/MapContainer'; // MapContainer 추가

function App() {
  return (
    <div className="App">
      <MapContainer /> {/* 지도 컴포넌트 추가 */}
    </div>
  );
}

export default App;