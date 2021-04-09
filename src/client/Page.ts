import React from "react";
import copyToClipboard from "copy-to-clipboard";
import { div, button, raw, a } from "./react";
import { timeout } from "../shared/timeout";
import { not } from "../shared/boolean";
import { ConnectedRoom, User } from "../shared";

export interface PageProps {
  room: ConnectedRoom;
  user: User;
  children: React.ReactNode[];
  onEndGame: () => void;
  onNewGame: () => void;
}

export function Page({
  room,
  user,
  children,
  onEndGame,
  onNewGame,
}: PageProps) {
  const [copied, setCopied] = React.useState(false);
  const [menuClass, setMenuClass] = React.useState<"hide" | "" | "show">(
    "hide"
  );

  async function copy() {
    if (copied) return;
    copyToClipboard(location.href);
    setCopied(true);
    await timeout(1000);
    setCopied(false);
  }

  async function toggleMenu() {
    if (menuClass === "hide") {
      setMenuClass("");
      await timeout(10);
      setMenuClass("show");
    } else {
      setMenuClass("");
      await timeout(500);
      setMenuClass("hide");
    }
  }

  const hasStarted = room.status !== "lobby" && room.status !== "countdown";

  function onMenuButton(disabled: boolean, action: () => void) {
    if (disabled) return null;
    return () => {
      action();
      toggleMenu();
    };
  }

  // prettier-ignore
  return div('page', {},
    div('row menu-row', {},
      div(`user-circle ${user.color}`, {},
        div(`user-icon`, {}, user.icon)),
      div('game_title', {}, 'Grapevine'),
      button('menu-button', toggleMenu, {},
        raw(menuIcon))
    ),
    div('players-row', {},
      room.users.map(player =>
        div(`player-circle ${player.color}`, { key: player.socketId },
          div('player-icon', {}, player.icon)))),
    div('page-body', {},
      div(`main-menu ${menuClass}`, {},
        button(`menu-item`, copy, {},
          `Copy invitation`,
          div(`copied ${copied ? 'show' : 'hide'}`, {}, 'copied!')),
        a(`menu-item`, '/', {}, `New room`),
        button(`menu-item ${hasStarted ? '' : 'disabled'}`, onMenuButton(!hasStarted, onEndGame), {}, `End game`),
        button(`menu-item ${hasStarted ? '' : 'disabled'}`, onMenuButton(!hasStarted, onNewGame), {}, `New game`),
      ),
      children)
  )
}

const menuIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <g data-name="Layer 2">
      <g data-name="menu">
        <rect width="24" height="24" transform="rotate(180 12 12)" opacity="0"/>
        <rect x="3" y="11" width="18" height="2" rx=".95" ry=".95"/>
        <rect x="3" y="16" width="18" height="2" rx=".95" ry=".95"/>
        <rect x="3" y="6" width="18" height="2" rx=".95" ry=".95"/>
      </g>
    </g>
  </svg>
`;
