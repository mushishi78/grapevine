import { io } from "socket.io-client";
import React from "react";
import ReactDom from "react-dom";
import * as uuid from "uuid";
import { App } from "./App";

window.addEventListener("load", () => {
  const roomCode = getRoomCode();
  const socket = io();
  const user = {
    sessionId: getSessionId(),
    icon: getUserIcon(),
    color: getUserColor(),
  };

  ReactDom.render(
    React.createElement(App, {
      roomCode,
      socket,
      user,
    }),
    document.querySelector("#root")
  );
});

function getRoomCode() {
  if (location.pathname.length > 5) return location.pathname.slice(1);
  const roomCode = makeRoomCode();
  history.pushState({}, null, `/${roomCode}`);
  return roomCode;
}

function makeRoomCode() {
  return buildArray(6, () =>
    getRandomMember("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
  ).join("");
}

function getSessionId() {
  return readFromSessionWithDefault("sessionId", () => uuid.v1());
}

function getUserIcon() {
  return readFromSessionWithDefault("userIcon", () =>
    getRandomMember([
      "🐱",
      "🐭",
      "🐹",
      "🐰",
      "🦊",
      "🐻",
      "🐼",
      "🐨",
      "🐯",
      "🦁",
      "🐮",
      "🐷",
      "🐸",
      "🐵",
    ])
  );
}

function getUserColor() {
  return readFromSessionWithDefault("userColor", () =>
    getRandomMember(["red", "blue", "green", "magenta", "cyan", "yellow"])
  );
}

function readFromSessionWithDefault(key: string, createDefault: () => string) {
  let value = sessionStorage.getItem(key);

  if (value == null) {
    value = createDefault();
    sessionStorage.setItem(key, value);
  }

  return value;
}

function getRandomMember(array: string): string;
function getRandomMember<T>(array: T[]): T;
function getRandomMember<T>(array: T[] | string): T | string {
  return array[Math.floor(Math.random() * array.length)];
}

function buildArray<T>(length: number, fn: (index: number) => T) {
  return Array(length)
    .fill(null)
    .map((_, index) => fn(index));
}
