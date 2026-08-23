import { createServerFn } from "@tanstack/react-start";

import { fetchEvents, fetchNews, fetchPrograms, fetchVolunteerRoles } from "./content.server";

export const getPrograms = createServerFn({ method: "GET" }).handler(async () => fetchPrograms());

export const getNews = createServerFn({ method: "GET" }).handler(async () => fetchNews());

export const getEvents = createServerFn({ method: "GET" }).handler(async () => fetchEvents());

export const getVolunteerRoles = createServerFn({ method: "GET" }).handler(async () =>
  fetchVolunteerRoles(),
);
