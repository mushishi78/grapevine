import { CountdownRoom } from "../shared";
import { div, button } from "./react";

interface Props {
  room: CountdownRoom;
  cancel: () => void;
}

export function Countdown({ room, cancel }: Props) {
  // prettier-ignore
  return div('content countdown', {},
    div('countdown_explanation', {}, 'Game starting in'),
    div('countdown_count', {}, room.count),
    button('countdown_cancel', cancel, { }, 'Cancel'))
}
