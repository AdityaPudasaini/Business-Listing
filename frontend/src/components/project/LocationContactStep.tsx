"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { AddressAutocomplete } from "@/components/project/AddressAutocomplete";
import { useGoogleMapsScript } from "@/hooks/useGoogleMapsScript";
import { theme } from "@/config/theme";
import type { RegisterFormData } from "@/components/sections/RegisterPage";
import { getActiveVertical } from "@/features/verticals";

interface LocationContactStepProps {
  values: RegisterFormData;
  onChange: (patch: Partial<RegisterFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  navButtons: ReactNode;
}

function RequiredMark() {
  return (
    <span className="ml-0.5" style={{ color: theme.colors.primary }}>
      *
    </span>
  );
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : undefined;
  }

  return undefined;
}

const DEFAULT_CENTER = { lat: 27.7172, lng: 85.324 };

export function LocationContactStep({
  values,
  onChange,
  navButtons,
}: LocationContactStepProps) {
  const vertical = getActiveVertical();
  const mapsLoaded = useGoogleMapsScript();

  const {
    formState: { errors },
  } = useFormContext<RegisterFormData>();

  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);

  const localAddressError = getErrorMessage(errors.localAddress);
  const mapAddressError =
    getErrorMessage(errors.mapAddress) ||
    getErrorMessage(errors.latitude) ||
    getErrorMessage(errors.longitude);

  const phoneError = getErrorMessage(errors.phone);
  const whatsappError = getErrorMessage(errors.whatsapp);
  const emailError = getErrorMessage(errors.email);
  const websiteError = getErrorMessage(errors.website);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const handleMapAddressChange = useCallback((address: string) => {
    onChangeRef.current({ mapAddress: address });
  }, []);

  const handleCoordsChange = useCallback(
    (coords: { lat: number; lng: number } | undefined) => {
      onChangeRef.current({
        latitude: coords?.lat,
        longitude: coords?.lng,
      });
    },
    [],
  );

  const hasLocation =
    values.latitude !== undefined && values.longitude !== undefined;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsLoaded]);

  useEffect(() => {
    if (!mapInstanceRef.current || !hasLocation) return;

    const google = (window as any).google;
    const position = {
      lat: values.latitude!,
      lng: values.longitude!,
    };

    if (!markerRef.current) {
      markerRef.current = new google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        draggable: true,
      });

      markerRef.current.addListener("dragend", () => {
        const positionAfterDrag = markerRef.current.getPosition();

        onChangeRef.current({
          latitude: positionAfterDrag.lat(),
          longitude: positionAfterDrag.lng(),
        });
      });
    } else {
      markerRef.current.setPosition(position);
    }

    mapInstanceRef.current.panTo(position);
    mapInstanceRef.current.setZoom(15);
  }, [hasLocation, values.latitude, values.longitude]);

  return (
    <div>
      <div className="max-w-3xl space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-900">
            Local Address
            <RequiredMark />
          </label>

          <div
            className={
              localAddressError ? "rounded-xl ring-1 ring-red-500" : ""
            }
          >
            <Input
              value={values.localAddress}
              onChange={(event) =>
                onChange({ localAddress: event.target.value })
              }
              placeholder="e.g. Shop 4, New Road, Kathmandu"
              required
            />
          </div>

          {localAddressError && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              {localAddressError}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-900">
            Search Location on the Map
            <RequiredMark />
          </label>

          <div
            className={mapAddressError ? "rounded-xl ring-1 ring-red-500" : ""}
          >
            <AddressAutocomplete
              value={values.mapAddress}
              onValueChange={handleMapAddressChange}
              onCoordsChange={handleCoordsChange}
            />
          </div>

          <p className="mt-1.5 text-xs text-gray-400">
            Search for your {vertical.labels.business}, then drag the pin to
            fine-tune the exact spot.
          </p>

          {mapAddressError && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              {mapAddressError}
            </p>
          )}
        </div>

        <div
          className={`h-[280px] overflow-hidden rounded-2xl border bg-gray-100 ${
            mapAddressError ? "border-red-400" : "border-gray-200"
          }`}
        >
          {mapsLoaded ? (
            <div ref={mapDivRef} className="h-full w-full" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
              Loading map...
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-900">
              Phone Number
              <RequiredMark />
            </label>

            <div className={phoneError ? "rounded-xl ring-1 ring-red-500" : ""}>
              <Input
                type="tel"
                value={values.phone}
                onChange={(event) => onChange({ phone: event.target.value })}
                placeholder="+977 98XXXXXXXX"
                required
              />
            </div>

            {phoneError && (
              <p role="alert" className="mt-1.5 text-sm text-red-600">
                {phoneError}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-900">
              WhatsApp Number
            </label>

            <div
              className={whatsappError ? "rounded-xl ring-1 ring-red-500" : ""}
            >
              <Input
                type="tel"
                value={values.whatsapp}
                onChange={(event) => onChange({ whatsapp: event.target.value })}
                placeholder="+977 98XXXXXXXX"
              />
            </div>

            {whatsappError && (
              <p role="alert" className="mt-1.5 text-sm text-red-600">
                {whatsappError}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-900">
              Email
            </label>

            <div className={emailError ? "rounded-xl ring-1 ring-red-500" : ""}>
              <Input
                type="email"
                value={values.email}
                onChange={(event) => onChange({ email: event.target.value })}
                placeholder="business@example.com"
              />
            </div>

            {emailError && (
              <p role="alert" className="mt-1.5 text-sm text-red-600">
                {emailError}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-900">
              Website
            </label>

            <div
              className={websiteError ? "rounded-xl ring-1 ring-red-500" : ""}
            >
              <Input
                type="url"
                value={values.website}
                onChange={(event) => onChange({ website: event.target.value })}
                placeholder="https://example.com"
              />
            </div>

            {websiteError && (
              <p role="alert" className="mt-1.5 text-sm text-red-600">
                {websiteError}
              </p>
            )}
          </div>
        </div>
      </div>

      {navButtons}
    </div>
  );
}
