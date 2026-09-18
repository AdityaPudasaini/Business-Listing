"use client";

import { create } from "zustand";
import type { AdminSubmission } from "@/types";
import type { RegisterFormData } from "@/components/sections/RegisterPage";
import { DAYS_OF_WEEK } from "@/data/amenities";

function createFormData(
  values: Partial<RegisterFormData>,
): RegisterFormData {
  return {
    businessName: "",
    description: "",
    category: "",
    bannerImage: null,
    businessPhoto: null,
    galleryPhotos: [],
    localAddress: "",
    mapAddress: "",
    latitude: undefined,
    longitude: undefined,
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    services: [],
    openingHours: DAYS_OF_WEEK.map((day) => ({
      day,
      open: "09:00",
      close: "18:00",
      closed: false,
    })),
    amenities: [],
    parkingAvailable: null,
    paymentMethods: [],
    ...values,
  };
}

const everestForm = createFormData({
  businessName: "Everest Auto Care",
  description:
    "Professional vehicle servicing, diagnostics, brake repairs, and oil changes.",
  category: "auto-garage",
  localAddress: "Shop 12, Thamel, Kathmandu",
  mapAddress: "Thamel, Kathmandu",
  latitude: 27.715,
  longitude: 85.3123,
  phone: "+977 9812345678",
  whatsapp: "+977 9812345678",
  email: "hello@everestautocare.com",
  website: "https://everestautocare.com",
  services: ["Oil Change", "Engine Diagnostics", "Brake Repair"],
  amenities: ["Wi-Fi", "Waiting Area"],
  parkingAvailable: true,
  paymentMethods: ["Cash", "eSewa", "QR Payment"],
});

const motoFixForm = createFormData({
  businessName: "MotoFix Garage",
  description:
    "Motorcycle servicing, repairs, tyre replacements, and genuine spare parts.",
  category: "motorcycle-repair",
  localAddress: "Patan Dhoka, Lalitpur",
  mapAddress: "Patan Dhoka, Lalitpur",
  latitude: 27.6695,
  longitude: 85.3206,
  phone: "+977 9841122334",
  whatsapp: "+977 9841122334",
  email: "contact@motofix.com",
  website: "",
  services: ["Motorcycle Service", "Chain Replacement", "Tyre Replacement"],
  amenities: ["Parking"],
  parkingAvailable: true,
  paymentMethods: ["Cash", "QR Payment"],
});

const quickWashForm = createFormData({
  businessName: "QuickWash Detailing",
  description:
    "Car wash, exterior polishing, interior detailing, and ceramic coating.",
  category: "car-wash",
  localAddress: "Boudha, Kathmandu",
  mapAddress: "Boudha, Kathmandu",
  latitude: 27.7215,
  longitude: 85.362,
  phone: "+977 9860011223",
  whatsapp: "",
  email: "quickwash@example.com",
  website: "",
  services: ["Car Wash", "Interior Detailing", "Ceramic Coating"],
  amenities: [],
  parkingAvailable: false,
  paymentMethods: ["Cash"],
});

const demoSubmissions: AdminSubmission[] = [
  {
    id: "sub-1",
    name: everestForm.businessName,
    category: everestForm.category,
    location: everestForm.localAddress,
    phone: everestForm.phone,
    services: everestForm.services.join(", "),
    amenities: everestForm.amenities.join(", "),
    submittedBy: "Ramesh Shrestha",
    submittedAt: "2026-09-16T09:30:00.000Z",
    status: "pending",
    hasChanges: false,
    formData: everestForm,
  },
  {
    id: "sub-2",
    name: "Himalayan Motors",
    category: "car-dealership",
    location: "Naxal, Kathmandu",
    phone: "+977 9801234567",
    services: "Vehicle Sales, Trade-in, Vehicle Inspection",
    amenities: "Parking, Finance Available",
    submittedBy: "Sanjay Rai",
    submittedAt: "2026-09-11T08:00:00.000Z",
    status: "published",
    hasChanges: false,
    formData: createFormData({
      businessName: "Himalayan Motors",
      description: "Pre-owned vehicles, trade-ins, financing, and inspections.",
      category: "car-dealership",
      localAddress: "Naxal, Kathmandu",
      mapAddress: "Naxal, Kathmandu",
      latitude: 27.7184,
      longitude: 85.327,
      phone: "+977 9801234567",
      email: "sales@himalayanmotors.com",
      services: ["Vehicle Sales", "Trade-in", "Vehicle Inspection"],
      amenities: ["Parking"],
      parkingAvailable: true,
      paymentMethods: ["Cash", "Bank Transfer", "QR Payment"],
    }),
  },
  {
    id: "sub-3",
    name: motoFixForm.businessName,
    category: motoFixForm.category,
    location: motoFixForm.localAddress,
    phone: motoFixForm.phone,
    services: motoFixForm.services.join(", "),
    amenities: motoFixForm.amenities.join(", "),
    submittedBy: "Aayush Thapa",
    submittedAt: "2026-09-08T13:15:00.000Z",
    status: "published",
    hasChanges: true,
    formData: motoFixForm,
  },
  {
    id: "sub-4",
    name: quickWashForm.businessName,
    category: quickWashForm.category,
    location: quickWashForm.localAddress,
    phone: quickWashForm.phone,
    services: quickWashForm.services.join(", "),
    amenities: quickWashForm.amenities.join(", "),
    submittedBy: "Prakash Lama",
    submittedAt: "2026-09-05T10:00:00.000Z",
    status: "rejected",
    hasChanges: false,
    formData: quickWashForm,
  },
];

interface SubmissionsState {
  submissions: AdminSubmission[];
  approve: (id: string) => void;
  reject: (id: string) => void;
  update: (id: string, formData: RegisterFormData) => void;
}

export const useSubmissionsStore = create<SubmissionsState>((set) => ({
  submissions: demoSubmissions,

  approve: (id) =>
    set((state) => ({
      submissions: state.submissions.map((listing) =>
        listing.id === id
          ? {
              ...listing,
              status: "published",
              hasChanges: false,
            }
          : listing,
      ),
    })),

  reject: (id) =>
    set((state) => ({
      submissions: state.submissions.map((listing) =>
        listing.id === id
          ? {
              ...listing,
              status: "rejected",
              hasChanges: false,
            }
          : listing,
      ),
    })),

  update: (id, formData) =>
    set((state) => ({
      submissions: state.submissions.map((listing) =>
        listing.id === id
          ? {
              ...listing,
              formData,
              name: formData.businessName,
              category: formData.category,
              location: formData.localAddress,
              phone: formData.phone,
              services: formData.services.join(", "),
              amenities: formData.amenities.join(", "),
            }
          : listing,
      ),
    })),
}));