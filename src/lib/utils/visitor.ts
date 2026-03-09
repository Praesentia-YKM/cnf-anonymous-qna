"use client";

export function getVisitorId(): string {
  if (typeof window === "undefined") return "";

  const key = "anonymous-qna-visitor-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}
