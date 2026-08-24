import { queryOptions } from "@tanstack/react-query";

import {
  getEvents,
  getNews,
  getPrograms,
  getVolunteerRoles,
} from "@/lib/content.functions";

/** Shared cache policy for public content: instant paint, silent revalidate. */
const PUBLIC_CACHE = {
  staleTime: 5 * 60_000,
  gcTime: 24 * 60 * 60_000,
  refetchOnMount: "always",
} as const;

export const programsQueryOptions = queryOptions({
  queryKey: ["programs"],
  queryFn: () => getPrograms(),
  ...PUBLIC_CACHE,
});

export const newsQueryOptions = queryOptions({
  queryKey: ["news"],
  queryFn: () => getNews(),
  ...PUBLIC_CACHE,
});

export const eventsQueryOptions = queryOptions({
  queryKey: ["events"],
  queryFn: () => getEvents(),
  ...PUBLIC_CACHE,
});

export const volunteerRolesQueryOptions = queryOptions({
  queryKey: ["volunteer-roles"],
  queryFn: () => getVolunteerRoles(),
  ...PUBLIC_CACHE,
});
