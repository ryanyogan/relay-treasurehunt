/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

// Model types
export class Game extends Object {}
export class HidingSpot extends Object {}

// Mocked data
const game = Object.assign(new Game(), {
  id: 1
});

let hidingSpots = [];
(() => {
  let hidingSpot;
  let indexOfSpotWithTreasure = Math.floor(Math.random() * 9);
  for (let i = 0; i < 9; i++) {
    hidingSpots.push(Object.assign(new HidingSpot(), {
      id: i.toString(),
      hasTreasure: (i === indexOfSpotWithTreasure),
      hasBeenChecked: false,
    }));
  }
})();

let turnsRemaining = 3;

export function checkHidingSpotForTreasure(id) {
  if (hidingSpots.some(hs => hs.hasTreasure && hs.hasBeenChecked)) {
    return;
  }

  turnsRemaining--;
  let hidingSpot = getHidingSpot(id);
  hidingSpot.hasBeenChecked = true;
};

export function getHidingSpot(id) {
  return hidingSpots.find(hs => hs.id === id);
};

export function getGame() { return game; };
export function getHidingSpots() { return hidingSpots; };
export function getTurnsRemaining() { return turnsRemaining; };
