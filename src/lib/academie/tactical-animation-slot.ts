/**
 * Globale limiet: maximaal één tactische animatie speelt tegelijk.
 * User-initiated play kan niet gestolen worden door autoplay van een andere visual.
 */

type StopFn = () => void;

let activeId: string | null = null;
let activeStop: StopFn | null = null;
let userLockedId: string | null = null;

export function claimAnimationSlot(
  id: string,
  stop: StopFn,
  opts?: { userInitiated?: boolean },
): boolean {
  const userInitiated = opts?.userInitiated === true;

  // Autoplay mag een user-gestarte animatie niet onderbreken.
  if (userLockedId && userLockedId !== id && !userInitiated) {
    return false;
  }

  if (activeId && activeId !== id && activeStop) {
    activeStop();
  }

  activeId = id;
  activeStop = stop;
  if (userInitiated) {
    userLockedId = id;
  }
  return true;
}

export function releaseAnimationSlot(id: string): void {
  if (activeId === id) {
    activeId = null;
    activeStop = null;
  }
  if (userLockedId === id) {
    userLockedId = null;
  }
}

export function getActiveAnimationId(): string | null {
  return activeId;
}
