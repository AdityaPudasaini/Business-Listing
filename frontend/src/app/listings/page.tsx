import { ListingsMapSection } from "@/components/sections/ListingsMapSection";

interface ListingsPageProps {
  searchParams: { address?: string; lat?: string; lng?: string };
}

export default function ListingsPage({ searchParams }: ListingsPageProps) {
  const lat = searchParams.lat ? parseFloat(searchParams.lat) : undefined;
  const lng = searchParams.lng ? parseFloat(searchParams.lng) : undefined;

  return (
    <>
      <ListingsMapSection
        initialAddress={searchParams.address}
        initialLat={lat}
        initialLng={lng}
      />
    </>
  );
}
