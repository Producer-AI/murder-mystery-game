const PREFIX = "murder-mystery-game";

function getStorageKey(joinCode: string) {
  return `${PREFIX}:${joinCode.toUpperCase()}`;
}

export function loadGuestToken(joinCode: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(getStorageKey(joinCode));
}

export function saveGuestToken(joinCode: string, guestToken: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getStorageKey(joinCode), guestToken);
}

export function clearGuestToken(joinCode: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getStorageKey(joinCode));
}
