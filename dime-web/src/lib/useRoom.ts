import { useSyncExternalStore } from "react";
import { roomStore } from "./room";
export function useRoom() {
  return useSyncExternalStore(roomStore.subscribe, roomStore.get, roomStore.getServer);
}
/** Set before navigating to /setup so the host room survives the route change. */
export const nav = { keepHostAlive: false };
