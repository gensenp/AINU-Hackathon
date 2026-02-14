import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { useState } from 'react';

const DEFAULT_CENTER: [number, number] = [40.7128, -74.006];
const DEFAULT_ZOOM = 10;

function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function App() {
  const [risk, setRisk] = useState<{ score: number; explanation: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLocationSelect = async (lat: number, lng: number) => {
    setLoading(true);
    setRisk(null);
    try {
      const res = await fetch(`/api/risk?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      if (res.ok) setRisk({ score: data.score, explanation: data.explanation });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-emerald-800 text-white px-4 py-3 shadow flex items-center gap-3">
        <img src="/aquasafe-logo.png" alt="" className="h-9 w-9 object-contain" />
        <div>
          <h1 className="text-xl font-bold">AquaSafe</h1>
          <p className="text-sm text-emerald-100">Find safe water — click the map for risk score</p>
        </div>
      </header>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 p-2">
        <div className="md:col-span-2 relative rounded-lg overflow-hidden border border-gray-200">
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            className="h-full w-full"
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onLocationSelect={handleLocationSelect} />
          </MapContainer>
        </div>
        <aside className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          {loading && <p className="text-gray-500">Loading risk score…</p>}
          {risk && (
            <div>
              <p className="text-2xl font-semibold text-gray-800">
                Score: <span className="text-emerald-600">{risk.score}</span>/100
              </p>
              <p className="mt-2 text-sm text-gray-600">{risk.explanation}</p>
            </div>
          )}
          {!loading && !risk && (
            <p className="text-gray-500">Click a point on the map to see water safety risk.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
