// listingForm.ts — shared between the admin review page and the owner
// dashboard's "Edit listing" panel, both of which open an existing listing
// in ListingWizard. Kept in one place so the two flows can't drift.
import { DAYS_OF_WEEK } from "@/data/amenities";
import { resolveGallery, resolveImage } from "@/lib/resolveListingImage";
import type { OwnerListing } from "@/types";
import type { RegisterFormData } from "@/components/sections/RegisterPage";

// Converts the flat backend record into the shape ListingWizard expects.
// Existing photos come back as plain URL strings; RegisterFormData's image
// fields accept those directly now, so they show up in the wizard as-is
// and only get re-uploaded if the admin/owner picks a new file.
export function toRegisterFormData(listing: OwnerListing): RegisterFormData {
  const hoursByDay = new Map(
    (listing.openingHours ?? []).map((row) => [row.day.toLowerCase(), row.hours]),
  );

  return {
    businessName: listing.name,
    description: listing.description || "",
    category: listing.category,
    bannerImage: listing.coverImage ?? null,
    businessPhoto: listing.image ?? null,
    galleryPhotos: listing.gallery ?? [],
    localAddress: listing.location,
    mapAddress: listing.location,
    latitude: listing.latitude,
    longitude: listing.longitude,
    phone: listing.phone || "",
    whatsapp: listing.whatsapp || "",
    email: listing.email || "",
    website: listing.website || "",
    facebook: listing.facebook || "",
    instagram: listing.instagram || "",
    tiktok: listing.tiktok || "",
    linkedin: listing.linkedin || "",
    services: listing.services ?? [],
    openingHours: DAYS_OF_WEEK.map((day) => {
      const raw = hoursByDay.get(day.toLowerCase());
      if (!raw || raw.toLowerCase() === "closed") {
        return { day, open: "09:00", close: "18:00", closed: true };
      }
      const [open, close] = raw.split(/\s*(?:-|–)\s*/);
      return { day, open: open || "09:00", close: close || "18:00", closed: false };
    }),
    amenities: listing.amenities ?? [],
    parkingAvailable: listing.parkingAvailable ?? null,
    paymentMethods: listing.paymentMethods ?? [],
  };
}

// NOTE: if a photo field is cleared (set to null) rather than replaced, the
// resolved value comes back `undefined` and is dropped from the JSON body —
// so today "remove banner image" during an edit doesn't clear it server
// side, it just leaves the old one in place. Only *replacing* a photo
// actually changes it. Explicit clearing needs the DTOs to accept a real
// `null` and the request body to include it, which isn't wired yet.
export async function toUpdatePayload(values: RegisterFormData) {
  const [image, coverImage, gallery] = await Promise.all([
    resolveImage(values.businessPhoto),
    resolveImage(values.bannerImage),
    resolveGallery(values.galleryPhotos),
  ]);

  return {
    name: values.businessName,
    description: values.description || undefined,
    category: values.category,
    address: values.localAddress,
    latitude: values.latitude,
    longitude: values.longitude,
    phone: values.phone,
    whatsapp: values.whatsapp || undefined,
    email: values.email || undefined,
    website: values.website || undefined,
    facebook: values.facebook || undefined,
    instagram: values.instagram || undefined,
    tiktok: values.tiktok || undefined,
    linkedin: values.linkedin || undefined,
    services: values.services,
    openingHours: values.openingHours.map((item) => ({
      day: item.day,
      hours: item.closed ? "Closed" : `${item.open} - ${item.close}`,
    })),
    amenities: values.amenities,
    parkingAvailable: values.parkingAvailable ?? undefined,
    paymentMethods: values.paymentMethods,
    image,
    coverImage,
    gallery,
  };
}