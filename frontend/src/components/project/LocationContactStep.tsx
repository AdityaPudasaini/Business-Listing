// LocationContactStep.tsx — Step 2 of the /register wizard: address, map
// pin, and contact details. Reuses AddressAutocomplete (same Places search +
// Locate Me used on the homepage/listings) to geocode a location, then lets
// the owner drag the resulting pin to fine-tune the exact spot before
// continuing. Not wired to a backend yet — coordinates just live in
// RegisterFormData until a real Business-creation endpoint exists. The
// Back/Continue footer is built once in RegisterPage and passed in as
// `navButtons`, matching BusinessDetailsStep's pattern.
"use client";

import { useCallback, useEffect, useRef } from "react";
import { Input } from "@/components/ui/Input";
import { AddressAutocomplete } from "@/components/project/AddressAutocomplete";
import { useGoogleMapsScript } from "@/hooks/useGoogleMapsScript";
import { theme } from "@/config/theme";
import { RegisterFormData } from "@/components/sections/RegisterPage";
import { getActiveVertical } from "@/features/verticals";

interface LocationContactStepProps {
  values: RegisterFormData;
  onChange: (patch: Partial<RegisterFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  navButtons: React.ReactNode;
}

function RequiredMark() {
  return (
    <span className="ml-0.5" style={{ color: theme.colors.primary }}>
      *
    </span>
  );
}

// Kathmandu — matches the default center used elsewhere (ListingsMapSection).
const DEFAULT_CENTER = { lat: 27.7172, lng: 85.324 };

export function LocationContactStep({
  values,
  onChange,
  navButtons,
}: LocationContactStepProps) {
  const vertical = getActiveVertical();
  const mapsLoaded = useGoogleMapsScript();
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // AddressAutocomplete's internal effect (which binds Google Places to the
  // input) depends on the onValueChange/onCoordsChange props it's given —
  // if those are new function references every render (which they would be
  // as plain inline arrows here, since `onChange` itself is a fresh closure
  // from RegisterPage on every keystroke), it tears down and rebuilds the
  // Places binding mid-typing, breaking suggestion selection. Routing
  // through a ref keeps the functions we actually pass down permanently
  // stable, while still always calling the latest onChange.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const handleMapAddressChange = useCallback((address: string) => {
    onChangeRef.current({ mapAddress: address });
  }, []);

  const handleCoordsChange = useCallback(
    (coords: { lat: number; lng: number } | undefined) => {
      onChangeRef.current({ latitude: coords?.lat, longitude: coords?.lng });
    },
    [],
  );

  const hasLocation =
    values.latitude !== undefined && values.longitude !== undefined;

  // Create the map once the script is ready.
  useEffect(() => {
    if (!mapsLoaded || !mapDivRef.current || mapInstanceRef.current) return;
    const google = (window as any).google;
    mapInstanceRef.current = new google.maps.Map(mapDivRef.current, {
      center: hasLocation
        ? { lat: values.latitude!, lng: values.longitude! }
        : DEFAULT_CENTER,
      zoom: hasLocation ? 15 : 12,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
    });
    // Only ever run this once — subsequent coordinate changes are handled
    // by the marker effect below via panTo, not by recreating the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsLoaded]);

  // Place/move a draggable marker whenever the coordinates change — either
  // from picking a Places suggestion, hitting Locate Me, or dragging the
  // pin itself (which writes back into form state on drop).
  useEffect(() => {
    if (!mapInstanceRef.current || !hasLocation) return;
    const google = (window as any).google;
    const position = { lat: values.latitude!, lng: values.longitude! };

    if (!markerRef.current) {
      markerRef.current = new google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        draggable: true,
      });
      markerRef.current.addListener("dragend", () => {
        const pos = markerRef.current.getPosition();
        onChangeRef.current({ latitude: pos.lat(), longitude: pos.lng() });
      });
    } else {
      markerRef.current.setPosition(position);
    }

    mapInstanceRef.current.panTo(position);
    mapInstanceRef.current.setZoom(15);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.latitude, values.longitude]);

  return (
    <div>
      <div className="space-y-5 max-w-3xl">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5">
            Local Address
            <RequiredMark />
          </label>
          <Input
            value={values.localAddress}
            onChange={(e) => onChange({ localAddress: e.target.value })}
            placeholder="e.g. Shop 4, New Road, Kathmandu"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5">
            Search Location on the Map
            <RequiredMark />
          </label>
          <AddressAutocomplete
            value={values.mapAddress}
            onValueChange={handleMapAddressChange}
            onCoordsChange={handleCoordsChange}
          />
          <p className="mt-1.5 text-xs text-gray-400">
            Search for your {vertical.labels.business}, then drag the pin to fine-tune the exact
            spot.
          </p>
        </div>

        <div className="h-[280px] rounded-2xl overflow-hidden border border-gray-200 bg-gray-100">
          {mapsLoaded ? (
            <div ref={mapDivRef} className="h-full w-full" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm text-gray-400">
              Loading map...
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
              Phone Number
              <RequiredMark />
            </label>
            <Input
              type="tel"
              value={values.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
              placeholder="Phone Number"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
              Whatsapp Number
            </label>
            <Input
              type="tel"
              value={values.whatsapp}
              onChange={(e) => onChange({ whatsapp: e.target.value })}
              placeholder="Whatsapp"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
              Email
            </label>
            <Input
              type="email"
              value={values.email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="Mail"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
              Website
            </label>
            <Input
              type="url"
              value={values.website}
              onChange={(e) => onChange({ website: e.target.value })}
              placeholder="Link"
            />
          </div>
        </div>
      </div>

      {navButtons}
    </div>
  );
}
