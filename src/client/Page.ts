import React from "react";
import copyToClipboard from "copy-to-clipboard";
import { div, button, raw } from "./react";
import { timeout } from "./timeout";
import { not } from "./boolean";
import { ConnectedRoom, User } from "../shared";

export interface PageProps {
  room: ConnectedRoom;
  user: User;
  children: React.ReactNode[];
}

export function Page({ room, user, children }: PageProps) {
  const [copied, setCopied] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);

  async function copy() {
    if (copied) return;
    copyToClipboard(location.href);
    setCopied(true);
    await timeout(1000);
    setCopied(false);
  }

  // prettier-ignore
  return div('page', {},
    div('row menu-row', {},
      div(`user-circle ${user.color}`, {},
        div(`user-icon`, {}, user.icon)),
      div('game_title', {}, 'Grapevine'),
      button('menu-button', () => setShowMenu(not), {},
        raw(menuIcon))
    ),
    div('players-row', {},
      room.users.map(player =>
        div(`player-circle ${player.color}`, { key: player.socketId },
          div('player-icon', {}, player.icon)))),

    children
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
