"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Тип магазину, який ми показуємо на мапі
export type ShopOnMap = {
  shopId: string;
  shopName: string;
  address: string;
  city: string;
  lat: number | null;
  lng: number | null;
  minPrice: number;
  flowersCount: number;
};

type MapViewProps = {
  center: [number, number];
  shops: ShopOnMap[];
  selectedShopId: string | null;
  onSelectShop: (id: string | null) => void;
};

// 🎯 Звичайна іконка (як раніше)
const defaultIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// 🔥 Іконка для вибраного магазина
const selectedIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Глобальна дефолтна іконка
L.Marker.prototype.options.icon = defaultIcon;

export default function MapView({
  center,
  shops,
  selectedShopId,
  onSelectShop,
}: MapViewProps) {
  return (
    <MapContainer
      key={`${center[0]}-${center[1]}`} // ⚡ форсимо ремоунт при зміні центру
      center={center}
      zoom={13}
      scrollWheelZoom={true}
      className="h-full w-full"
    >
      {/* @ts-ignore – іноді TS чудить на TileLayer */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {shops
        .filter((s) => s.lat != null && s.lng != null)
        .map((shop) => {
          const isSelected = shop.shopId === selectedShopId;

          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${shop.address}, ${shop.city} ${shop.shopName}`
          )}`;

          return (
            <Marker
              key={shop.shopId}
              position={[shop.lat as number, shop.lng as number]}
              icon={isSelected ? selectedIcon : defaultIcon}
              eventHandlers={{
                click: () => {
                  onSelectShop(isSelected ? null : shop.shopId);
                },
              }}
            >
              <Popup>
                <div className="text-xs">
                  <p className="font-semibold">{shop.shopName}</p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    {shop.city} · {shop.address}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-900">
                    від {shop.minPrice.toLocaleString("uk-UA")} грн
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    Варіантів: {shop.flowersCount}
                  </p>

                  <button
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => window.open(mapsUrl, "_blank")}
                  >
                    Відкрити в Google Maps
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
    </MapContainer>
  );
}
