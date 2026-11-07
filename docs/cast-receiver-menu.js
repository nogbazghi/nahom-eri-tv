import { createListNav } from "./nav.js";

const SWIPE_THRESHOLD_PX = 40;

export function createReceiverChannelMenu({
  document,
  menuOverlay,
  channelList,
  menuToggle,
  getCurrentChannel,
  getPlayer,
  onSelectChannel,
}) {
  let availableItems = [];
  let hasChannels = false;
  let touchStart = null;
  menuToggle.hidden = true;

  function closeMenu() {
    menuOverlay.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
    channelNav.reset();
    touchStart = null;
  }

  const channelNav = createListNav({
    getItems: () => availableItems,
    onActivate: (item) => {
      onSelectChannel(item.dataset.channel);
      closeMenu();
    },
  });

  function openMenu() {
    if (!hasChannels) return;
    menuOverlay.hidden = false;
    menuToggle.setAttribute("aria-expanded", "true");
    channelNav.focusWhere((item) => item.dataset.channel === getCurrentChannel());
  }

  function toggleMenu() {
    if (menuOverlay.hidden) {
      openMenu();
    } else {
      closeMenu();
    }
  }

  function render(channels) {
    channelList.textContent = "";
    availableItems = [];
    hasChannels = channels.length > 0;
    menuToggle.hidden = !hasChannels;

    for (const channel of channels) {
      const item = document.createElement("li");
      item.className = "channel-item";
      item.dataset.channel = channel.name;
      item.tabIndex = -1;
      item.textContent = channel.name;

      if (channel.available) {
        availableItems.push(item);
        item.addEventListener("click", () => {
          channelNav.focusWhere((candidate) => candidate === item);
          channelNav.activate();
        });
      } else {
        item.setAttribute("aria-disabled", "true");
      }

      channelList.appendChild(item);
    }

    if (!hasChannels && !menuOverlay.hidden) {
      closeMenu();
    } else if (!menuOverlay.hidden) {
      channelNav.focusWhere((item) => item.dataset.channel === getCurrentChannel());
    }
  }

  function seekBy(seconds) {
    const player = getPlayer();
    if (
      !player ||
      typeof player.getCurrentTime !== "function" ||
      typeof player.seekTo !== "function"
    ) {
      return;
    }

    const currentTime = player.getCurrentTime();
    if (!Number.isFinite(currentTime)) return;
    player.seekTo(Math.max(0, currentTime + seconds), true);
  }

  menuToggle.addEventListener("click", toggleMenu);
  document.addEventListener("keydown", (event) => {
    if (menuOverlay.hidden) {
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        openMenu();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        seekBy(-10);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        seekBy(10);
      }
      return;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      channelNav.move(event.key === "ArrowUp" ? -1 : 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
    } else if (event.key === "Enter") {
      event.preventDefault();
      channelNav.activate();
    } else if (event.key === "Escape" || event.key === "Backspace") {
      event.preventDefault();
      closeMenu();
    }
  });

  menuOverlay.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length === 0) return;
      const touch = event.touches[0];
      touchStart = { x: touch.clientX, y: touch.clientY };
    },
    { passive: true }
  );

  menuOverlay.addEventListener(
    "touchmove",
    (event) => {
      if (!touchStart || event.touches.length === 0) return;
      const touch = event.touches[0];
      const dx = touch.clientX - touchStart.x;
      const dy = touch.clientY - touchStart.y;
      if (Math.abs(dy) > Math.abs(dx)) event.preventDefault();
    },
    { passive: false }
  );

  menuOverlay.addEventListener("touchend", (event) => {
    if (!touchStart || event.changedTouches.length === 0) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    touchStart = null;

    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > SWIPE_THRESHOLD_PX) {
      channelNav.move(dy < 0 ? 1 : -1);
    } else if (dx > SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) {
      event.preventDefault();
      channelNav.activate();
    }
  });

  menuOverlay.addEventListener("touchcancel", () => {
    touchStart = null;
  });

  return { render };
}
