import { NextResponse } from "next/server";

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function apiUnauthorized() {
  return apiError("Unauthorized", 401);
}

export function apiNotFound(resource = "Resource") {
  return apiError(`${resource} not found`, 404);
}

export function apiForbidden() {
  return apiError("Forbidden", 403);
}

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
