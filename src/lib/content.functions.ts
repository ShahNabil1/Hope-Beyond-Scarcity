import { createServerFn } from "@tanstack/react-start";

import {
  fetchEvents,
  fetchNews,
  fetchNewsPost,
  fetchPrograms,
  fetchSiteSettings,
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

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () =>
  fetchSiteSettings(),
);

export const getLegalPages = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchLegalPages } = await import("./content.server");
  return fetchLegalPages();
});

export const getLegalPage = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => {
    if (!data?.slug || !/^[a-z0-9-]{1,120}$/i.test(data.slug)) throw new Error("Invalid slug");
    return data;
  })
  .handler(async ({ data }) => {
    const { fetchLegalPage } = await import("./content.server");
    return fetchLegalPage(data.slug);
  });

export const getHomeContent = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchHomeContent } = await import("./content.server");
  return fetchHomeContent();
});
