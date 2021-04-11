import { ConnectedRoom, SessionId } from "../shared";
import { button, div } from "./react";

interface Props {
  room: ConnectedRoom;
  missingSessionIds: SessionId[];
  onNewGame: () => void;
}

export function MissingPlayers(props: Props) {
  const missingUsers = props.room.users.filter((u) =>
    props.missingSessionIds.includes(u.sessionId)
  );

  // prettier-ignore
  return div("MissingPlayers", {},
    div("MissingPlayers_title", {}, "Missing players"),
    div("MissingPlayers_explanation", {}, `It looks like the following players has lost their connection:`),
    div("MissingPlayers_users", {},
      missingUsers.map(user =>
        div(`player-circle ${user.color}`, { key: user.sessionId },
          div('player-icon', {}, user.icon)))),
    div("MissingPlayers_explanation", {}, `If you don't think they are coming back, you can start a new game`),
    button(`MissingPlayers_new-game`, props.onNewGame, {}, `New game`));
}
