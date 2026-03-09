"use client";

export function getNickname(eventCode: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`anonymous-qna-nickname-${eventCode}`);
}

export function setNickname(eventCode: string, nickname: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`anonymous-qna-nickname-${eventCode}`, nickname);
}

export function hasNickname(eventCode: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`anonymous-qna-nickname-${eventCode}`) !== null;
}
