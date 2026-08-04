/**
 * Covia Ride Helpers — ride-specific display and calculation utilities.
 */

import { naira } from "./format";

/** Get a human-readable label for a ride status. */
export function getRideStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Draft",
    open: "Open",
    full: "Full",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status;
}

/** Get a color key for a ride status (maps to theme colors). */
export function getRideStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "mutedForeground",
    open: "primary",
    full: "warning",
    in_progress: "accent",
    completed: "success",
    cancelled: "destructive",
  };
  return colors[status] ?? "mutedForeground";
}

/** Calculate the fare display string. */
export function formatFare(
  amount: number | null,
  mode: string = "manual",
): string {
  if (amount === null || amount === undefined) return "Free";
  if (amount === 0) return "Free";
  return naira(amount);
}

/** Get a label for the fare mode. */
export function getFareModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    manual: "Fixed Price",
    split: "Split Fare",
    free: "Free Ride",
  };
  return labels[mode] ?? mode;
}

/** Format seat availability. */
export function formatSeats(available: number, total: number): string {
  if (available === 0) return "Full";
  if (available === total) return `${total} seats`;
  return `${available} of ${total} seats`;
}

/** Format pickup location for display. */
export function formatPickupLocation(location: string | null | undefined): string {
  if (!location?.trim()) return "No pickup set";
  return location.trim();
}

/** Format dropoff location for display. */
export function formatDropoffLocation(location: string | null | undefined): string {
  if (!location?.trim()) return "No destination set";
  return location.trim();
}

/** Check if a ride can be joined. */
export function canJoinRide(
  status: string,
  availableSeats: number,
): boolean {
  return status === "open" && availableSeats > 0;
}

/** Check if a ride can be cancelled. */
export function canCancelRide(status: string): boolean {
  return ["draft", "open"].includes(status);
}

/** Check if a ride can be started by the host. */
export function canStartRide(status: string): boolean {
  return status === "open";
}

/** Check if a ride can be completed. */
export function canCompleteRide(status: string): boolean {
  return status === "in_progress";
}
