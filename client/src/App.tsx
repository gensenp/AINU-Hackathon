import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { useState, useEffect } from 'react';

const DEFAULT_CENTER: [number, number] = [40.7128, -74.006];
const DEFAULT_ZOOM = 10;

type SafeWaterPoint = { id: string; lat: number; lng: number; name: string; distanceKm: number };

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
  const [lastClicked, setLastClicked] = useState<{ lat: number; lng: number } | null>(null);
  const [safeWater, setSafeWater] = useState<SafeWaterPoint[] | null>(null);
  const [loadingSafeWater, setLoadingSafeWater] = useState(false);
  const [safeWaterError, setSafeWaterError] = useState<string | null>(null);
  const [backendReachable, setBackendReachable] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.ok)
      .then(setBackendReachable)
      .catch(() => setBackendReachable(false));
  }, []);

  const handleLocationSelect = async (lat: number, lng: number) => {
    setLastClicked({ lat, lng });
    setLoading(true);
    setRisk(null);
    setSafeWater(null);
    setSafeWaterError(null);
    try {
      const res = await fetch(`/api/risk?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      if (res.ok) setRisk({ score: data.score, explanation: data.explanation });
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbySafeWater = async (lat: number, lng: number) => {
    setLoadingSafeWater(true);
    setSafeWater(null);
    setSafeWaterError(null);
    try {
      const res = await fetch(`/api/water/nearby?lat=${lat}&lng=${lng}&limit=5`);
      const data = await res.json();
      if (res.ok) setSafeWater(data.points ?? []);
      else setSafeWaterError(data.error ?? 'Failed to load safe water points');
    } catch (e) {
      setSafeWaterError('Couldn’t reach the API. Make sure the backend is running (e.g. npm run dev from repo root, or cd server && npm run dev).');
    } finally {
      setLoadingSafeWater(false);
    }
  };

  const handleFindSafeWaterNearMe = () => {
    if (!navigator.geolocation) {
      setSafeWaterError('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchNearbySafeWater(pos.coords.latitude, pos.coords.longitude),
      () => setSafeWaterError('Could not get your location. Check permissions or try "from this point".')
    );
  };

  const handleFindSafeWaterFromPoint = () => {
    if (lastClicked) fetchNearbySafeWater(lastClicked.lat, lastClicked.lng);
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-slate-800 text-white px-4 py-3 shadow flex items-center gap-4">
        <img src="/aquasafe-logo.png" alt="" className="h-14 w-14 object-contain shrink-0" />
        <div>
          <h1 className="text-xl font-bold">AquaSafe</h1>
          <p className="text-sm text-slate-300">Find safe water — click the map for risk score</p>
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
        <aside className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex flex-col gap-4 overflow-auto">
          {backendReachable === false && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3 rounded-lg">
              <strong>Backend not connected.</strong> In a terminal from the repo folder run: <code className="block mt-1 bg-amber-100 px-2 py-1 rounded text-xs">npm run dev</code>
              Or run the server alone: <code className="block mt-1 bg-amber-100 px-2 py-1 rounded text-xs">cd server && npm run dev</code>
            </div>
          )}
          <div>
            <button
              type="button"
              onClick={handleFindSafeWaterNearMe}
              disabled={loadingSafeWater}
              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-lg shadow text-sm"
            >
              {loadingSafeWater ? 'Finding…' : 'Find safe water near me'}
            </button>
            {lastClicked && (
              <button
                type="button"
                onClick={handleFindSafeWaterFromPoint}
                disabled={loadingSafeWater}
                className="w-full mt-2 py-2 px-3 bg-emerald-100 hover:bg-emerald-200 disabled:opacity-50 text-emerald-800 font-medium rounded-lg text-sm"
              >
                From clicked point
              </button>
            )}
          </div>

          {safeWaterError && (
            <p className="text-sm text-red-600">{safeWaterError}</p>
          )}
          {safeWater && safeWater.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Nearest safe water</h3>
              <ul className="space-y-2">
                {safeWater.map((p: SafeWaterPoint) => (
                  <li key={p.id} className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">
                    <span className="font-medium">{p.name}</span>
                    <span className="block text-gray-500">{p.distanceKm} km away</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {safeWater && safeWater.length === 0 && !safeWaterError && (
            <p className="text-sm text-gray-500">No safe water points found nearby.</p>
          )}

          <hr className="border-gray-200" />

          {loading && <p className="text-gray-500">Loading risk score…</p>}
          {risk && (
            <div>
              <p className="text-2xl font-semibold text-gray-800">
                Score: <span className="text-blue-600">{risk.score}</span>/100
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
