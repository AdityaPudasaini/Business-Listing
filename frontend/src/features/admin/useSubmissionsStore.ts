"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getActiveVertical } from "@/features/verticals";
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

function cloneFormData(values: RegisterFormData): RegisterFormData {
  return {
    ...values,
    bannerImage: values.bannerImage,
    businessPhoto: values.businessPhoto,
    galleryPhotos: [...values.galleryPhotos],
    services: [...values.services],
    openingHours: values.openingHours.map((day) => ({ ...day })),
    amenities: [...values.amenities],
    paymentMethods: [...values.paymentMethods],
  };
}

/*
  Browser localStorage cannot store File objects correctly.

  The submission details remain persistent, while uploaded images are cleared
  after refresh. Real image persistence will later come from your backend
  upload endpoint.
*/
function formDataForStorage(values: RegisterFormData): RegisterFormData {
  return {
    ...cloneFormData(values),
    bannerImage: null,
    businessPhoto: null,
    galleryPhotos: [],
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

const himalayanMotorsForm = createFormData({
  businessName: "Himalayan Motors",
  description: "Pre-owned vehicles, trade-ins, financing, and inspections.",
  category: "car-dealership",
  localAddress: "Naxal, Kathmandu",
  mapAddress: "Naxal, Kathmandu",
  latitude: 27.7184,
  longitude: 85.327,
  phone: "+977 9801234567",
  whatsapp: "",
  email: "sales@himalayanmotors.com",
  website: "",
  services: ["Vehicle Sales", "Trade-in", "Vehicle Inspection"],
  amenities: ["Parking"],
  parkingAvailable: true,
  paymentMethods: ["Cash", "Bank Transfer", "QR Payment"],
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
    name: himalayanMotorsForm.businessName,
    category: himalayanMotorsForm.category,
    location: himalayanMotorsForm.localAddress,
    phone: himalayanMotorsForm.phone,
    services: himalayanMotorsForm.services.join(", "),
    amenities: himalayanMotorsForm.amenities.join(", "),
    submittedBy: "Sanjay Rai",
    submittedAt: "2026-09-11T08:00:00.000Z",
    status: "published",
    hasChanges: false,
    formData: himalayanMotorsForm,
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

function cloneDemoSubmissions(): AdminSubmission[] {
  return demoSubmissions.map((listing) => ({
    ...listing,
    formData: cloneFormData(listing.formData),
  }));
}

function createSubmissionId() {
  return `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface SubmissionsState {
  submissions: AdminSubmission[];

  createSubmission: (
    formData: RegisterFormData,
    submittedBy?: string,
  ) => string;

  approve: (id: string) => void;
  reject: (id: string) => void;
  update: (id: string, formData: RegisterFormData) => void;

  resetDemoSubmissions: () => void;
}

export const useSubmissionsStore = create<SubmissionsState>()(
  persist(
    (set) => ({
      submissions: cloneDemoSubmissions(),

      createSubmission: (formData, submittedBy = "Demo business owner") => {
        const id = createSubmissionId();

        const newSubmission: AdminSubmission = {
          id,
          name: formData.businessName,
          category: formData.category,
          location: formData.localAddress,
          phone: formData.phone,
          services: formData.services.join(", "),
          amenities: formData.amenities.join(", "),
          submittedBy,
          submittedAt: new Date().toISOString(),
          status: "pending",
          hasChanges: false,
          formData: cloneFormData(formData),
        };

        set((state) => ({
          submissions: [newSubmission, ...state.submissions],
        }));

        return id;
      },

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
                  formData: cloneFormData(formData),
                  name: formData.businessName,
                  category: formData.category,
                  location: formData.localAddress,
                  phone: formData.phone,
                  services: formData.services.join(", "),
                  amenities: formData.amenities.join(", "),

                  /*
                    If an already published listing is edited, mark it as
                    changed until an admin approves it again.
                  */
                  hasChanges:
                    listing.status === "published" ? true : listing.hasChanges,
                }
              : listing,
          ),
        })),

      resetDemoSubmissions: () => {
        set({
          submissions: cloneDemoSubmissions(),
        });
      },
    }),
    {
      name: `${getActiveVertical().brandName.toLowerCase()}-admin-submissions-v1`,
      version: 1,

      partialize: (state) => ({
        submissions: state.submissions.map((listing) => ({
          ...listing,
          formData: formDataForStorage(listing.formData),
        })),
      }),
    },
  ),
);