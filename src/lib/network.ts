/**
 * Covia Network — connection status detection and monitoring.
 * Uses react-native's NetInfo for offline/online state.
 */

import { AppState, AppStateStatus } from "react-native";

export type NetworkState = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
};

type NetworkListener = (state: NetworkState) => void;

let currentState: NetworkState = {
  isConnected: true,
  isInternetReachable: true,
  type: "unknown",
};

const listeners = new Set<NetworkListener>();
let appStateSubscription: { remove(): void } | null = null;

function handleAppStateChange(nextState: AppStateStatus) {
  if (nextState === "active") {
    // App came to foreground — assume online unless proven otherwise
    currentState = { ...currentState, isConnected: true };
    notifyListeners();
  }
}

/** Initialize network monitoring. Call once at app startup. */
export function initNetworkMonitoring(): void {
  if (appStateSubscription) return;

  appStateSubscription = AppState.addEventListener("change", handleAppStateChange);

  // Try to use NetInfo if available
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const NetInfo = require("@react-native-community/netinfo").default;
    NetInfo.fetch().then((info: any) => {
      currentState = {
        isConnected: info.isConnected ?? true,
        isInternetReachable: info.isInternetReachable ?? null,
        type: info.type ?? "unknown",
      };
      notifyListeners();
    });

    NetInfo.addEventListener((info: any) => {
      currentState = {
        isConnected: info.isConnected ?? true,
        isInternetReachable: info.isInternetReachable ?? null,
        type: info.type ?? "unknown",
      };
      notifyListeners();
    });
  } catch {
    // NetInfo not installed — assume always online
  }
}

/** Get the current network state. */
export function getNetworkState(): NetworkState {
  return { ...currentState };
}

/** Check if the device is currently connected. */
export function isOnline(): boolean {
  return currentState.isConnected;
}

/** Subscribe to network state changes. Returns an unsubscribe function. */
export function onNetworkChange(listener: NetworkListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  const state = { ...currentState };
  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch {
      // Listener error should not break the system
    }
  });
}

/** Clean up network monitoring. */
export function destroyNetworkMonitoring(): void {
  appStateSubscription?.remove();
  appStateSubscription = null;
  listeners.clear();
}
