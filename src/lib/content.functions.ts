import { createServerFn } from "@tanstack/react-start";

import {
  fetchEvents,
  fetchNews,
  fetchNewsPost,
  fetchPrograms,
  fetchVolunteerRoles,
} from "./content.server";

export const getPrograms = createServerFn({ method: "GET" }).handler(async () => fetchPrograms());

export const getNews = createServerFn({ method: "GET" }).handler(async () => fetchNews());

export const getNewsPost = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => {
    if (!data?.slug || !/^[a-z0-9-]{1,120}$/i.test(data.slug)) throw new Error("Invalid slug");
    return data;
  })
  .handler(async ({ data }) => fetchNewsPost(data.slug));


export const getEvents = createServerFn({ method: "GET" }).handler(async () => fetchEvents());

export const getVolunteerRoles = createServerFn({ method: "GET" }).handler(async () =>
  fetchVolunteerRoles(),
);
