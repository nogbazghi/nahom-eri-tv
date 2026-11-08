import { createListNav } from "./nav.js";

export function createReceiverChannelMenu({
  document,
  menuOverlay,
  channelList,
  menuToggle,
  getCurrentChannel,
  onSelectChannel,
}) {
  let availableItems = [];
  let hasChannels = false;
  menuToggle.hidden = true;

  function closeMenu() {
    menuOverlay.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
    channelNav.reset();
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

  menuToggle.addEventListener("click", toggleMenu);
  document.addEventListener("keydown", (event) => {
    if (menuOverlay.hidden) {
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        openMenu();
      }
      return;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      channelNav.move(event.key === "ArrowUp" ? -1 : 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      channelNav.activate();
    } else if (event.key === "Escape" || event.key === "Backspace") {
      event.preventDefault();
      closeMenu();
    }
  });

  return { render };
}
