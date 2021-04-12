import { ConnectedRoom, getMissingSessionIds, SessionId } from "../shared";
import { button, div } from "./react";

interface Props {
  room: ConnectedRoom;
  takePlace: (sessionId: SessionId) => void;
}

export function WaitingRoom({ room, takePlace }: Props) {
  const missingSessionIds = getMissingSessionIds(room);
  const missingUsers = room.users.filter((u) =>
    missingSessionIds.includes(u.sessionId)
  );

  // prettier-ignore
  return div('content waiting-room', {},
    div('waiting-room_title', {}, 'Game in progress'),
    missingUsers.length === 0 && (
      div('waiting-room_explanation', {}, `
        There's currently a game in progress. Please wait until the game has finished
        so that you can join the next one.
      `)
    ),
    missingUsers.length > 0 && (
      div('waiting-room_explanation', {}, `
        There's currently a game in progress. However the following players have left
        the game and you can take their place
      `)
    ),
    missingUsers.length > 0 && (
      div('waiting-room_missing-users', {},
        missingUsers.map(user =>
          div('waiting-room_missing-user', {},
            div(`player-circle ${user.color}`, { key: user.sessionId },
              div('player-icon', {}, user.icon)),
            button('waiting-room_select-user', () => takePlace(user.sessionId), {}, 'Take place'))))
    ))
}
