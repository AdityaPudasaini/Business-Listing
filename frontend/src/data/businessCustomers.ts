// businessCustomers.ts — mock data for the "Customers" view (owner dashboard
// Customers tab + admin per-business page). Stands in for the backend until
// ChatLog and OwnerMessage models ship — see types/index.ts for the shapes
// this needs to match once it's wired to real endpoints.
//
// businessId "cmucblntv000111e830659bia" is a real listing id (Islington
// Workshop) used for local testing. "biz-demo-2" is still a placeholder and
// won't match anything real. Swap this file's usage for a real
// services/api.ts call once the backend has ChatLog/OwnerMessage models.
import type { BusinessCustomer } from "@/types";

export const demoBusinessCustomers: BusinessCustomer[] = [
  {
    id: "cust-1",
    name: "Sujata Karki",
    email: "sujata.karki@example.com",
    phone: "+977 98410 22391",
    businessId: "cmucblntv000111e830659bia",
    businessName: "Islington Workshop",
    bookings: [
      {
        id: "bk-1",
        date: "2026-09-27",
        time: "10:30",
        service: "Full service",
        status: "confirmed",
      },
      {
        id: "bk-0",
        date: "2026-06-12",
        time: "14:00",
        service: "Oil change",
        status: "confirmed",
      },
    ],
    review: {
      id: "rv-1",
      rating: 5,
      title: "Quick and honest",
      message:
        "In and out in under an hour, and they showed me the old parts before replacing anything. Will come back.",
      createdAt: "2026-06-13T09:12:00Z",
    },
    chatLog: [
      {
        id: "chat-1a",
        sender: "user",
        content: "Do you do same-day oil changes?",
        createdAt: "2026-06-11T08:03:00Z",
      },
      {
        id: "chat-1b",
        sender: "bot",
        content:
          "Islington Workshop offers: Oil change, Brake service, Tyre rotation, AC service, Battery check.",
        createdAt: "2026-06-11T08:03:04Z",
      },
      {
        id: "chat-1c",
        sender: "user",
        content: "where are you located",
        createdAt: "2026-06-11T08:04:10Z",
      },
      {
        id: "chat-1d",
        sender: "bot",
        content: "Islington Workshop is located at Balkhu, Kathmandu.",
        createdAt: "2026-06-11T08:04:12Z",
      },
    ],
    messages: [
      {
        id: "msg-1a",
        sender: "owner",
        content:
          "Hi Sujata — reminder your brake pads are due for a check around your next service. Want me to add it to Saturday's booking?",
        createdAt: "2026-09-20T11:00:00Z",
        read: true,
      },
      {
        id: "msg-1b",
        sender: "customer",
        content: "Yes please, that works.",
        createdAt: "2026-09-20T12:40:00Z",
        read: true,
      },
    ],
  },
  {
    id: "cust-2",
    name: "Rojina Shrestha",
    email: "rojina.s@example.com",
    phone: "+977 98023 88410",
    businessId: "cmucblntv000111e830659bia",
    businessName: "Islington Workshop",
    bookings: [
      {
        id: "bk-2",
        date: "2026-09-25",
        time: "09:00",
        service: "Tyre rotation",
        status: "pending",
      },
    ],
    chatLog: [
      {
        id: "chat-2a",
        sender: "user",
        content: "book",
        createdAt: "2026-09-24T15:22:00Z",
      },
      {
        id: "chat-2b",
        sender: "bot",
        content:
          "You can book directly with Islington Workshop — I can open the booking form for you.",
        createdAt: "2026-09-24T15:22:03Z",
      },
    ],
    messages: [],
  },
  {
    id: "cust-3",
    name: "Bibek Thapa",
    email: "bibek.thapa@example.com",
    businessId: "cmucblntv000111e830659bia",
    businessName: "Islington Workshop",
    bookings: [],
    review: {
      id: "rv-3",
      rating: 2,
      title: "Waited a long time",
      message:
        "Booked for 2pm, wasn't seen until almost 3:30. Work itself was fine once it started.",
      createdAt: "2026-08-30T16:45:00Z",
    },
    chatLog: [],
    messages: [
      {
        id: "msg-3a",
        sender: "owner",
        content:
          "Hi Bibek, sorry about the wait on the 30th — we've since added a second bay for afternoon slots. Hope we can make it right next time.",
        createdAt: "2026-08-31T09:15:00Z",
        read: false,
      },
    ],
  },
  {
    id: "cust-4",
    name: "Anish Gurung",
    phone: "+977 98112 30044",
    businessId: "biz-demo-2",
    businessName: "Bhojan Hub — Thamel",
    bookings: [
      {
        id: "bk-4",
        date: "2026-09-28",
        time: "19:30",
        service: "Table for 4",
        status: "confirmed",
      },
    ],
    chatLog: [
      {
        id: "chat-4a",
        sender: "user",
        content: "do you have outdoor seating",
        createdAt: "2026-09-22T18:10:00Z",
      },
      {
        id: "chat-4b",
        sender: "bot",
        content:
          "I'm not able to answer that in detail yet, but you can find more about Bhojan Hub — Thamel further up this page, or ask me about booking, services, location, or contact info.",
        createdAt: "2026-09-22T18:10:02Z",
      },
    ],
    messages: [],
  },
];

export function getCustomersForBusiness(businessId: string) {
  return demoBusinessCustomers.filter(
    (customer) => customer.businessId === businessId,
  );
}