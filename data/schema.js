/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';

import {
  connectionArgs,
  connectionDefinitions,
  connectionFromArray,
  fromGlobalId,
  globalIdField,
  mutationWithClientMutationId,
  nodeDefinitions,
} from 'graphql-relay';

import {
  // Import methods that your schema can use to interact with your database
  Game,
  HidingSpot,
  checkHidingSpotForTreasure,
  getGame,
  getHidingSpot,
  getHidingSpots,
  getTurnsRemaining
} from './database';

/**
 * We get the node interface and field from the Relay library.
 *
 * The first method defines the way we resolve an ID to its object.
 * The second defines the way we resolve an object to its GraphQL type.
 */
const { nodeInterface, nodeField } = nodeDefinitions(
  (globalId) => {
    const { type, id } = fromGlobalId(globalId);

    if (type === 'Game') {
      return getGame(id);
    }
    else if (type === 'HidingSpot') {
      return getHidingSpot(id);
    }
    else {
      return null;
    }
  },
  (obj) => {
    if (obj instanceof Game) {
      return gameType;
    }
    else if (obj instanceof HidingSpot) {
      return hidingSpotType;
    }
    else {
      return null;
    }
  }
)

const gameType = new GraphQLObjectType({
  name: 'Game',
  description: 'A treasure search game',
  fields: () => ({
    id: globalIdField('Game'),
    hidingSpots: {
      type: hidingSpotConnection,
      description: 'Places where treasure might be hidden',
      args: connectionArgs,
      resolve: (game, args) => connectionFromArray(getHidingSpots(), args)
    },
    turnsRemaining: {
      type: GraphQLInt,
      description: 'The number of turns a player has left to find the treasure',
      resolve: () => getTurnsRemaining()
    }
  }),
  interfaces: [nodeInterface]
});

const hidingSpotType = new GraphQLObjectType({
  name: 'HidingSpot',
  description: 'A place where you might find a treasure',
  fields: () => ({
    id: globalIdField('HidingSpot'),
    hasBeenChecked: {
      type: GraphQLBoolean,
      description: 'True if this spot has already been checked for treasure',
      resolve: (hidingSpot) => hidingSpot.hasBeenChecked
    },
    hasTreasure: {
      type: GraphQLBoolean,
      description: 'True if this hiding spot holds treasure',
      resolve: (hidingSpot) => {
        if (hidingSpot.hasBeenChecked) {
          return hidingSpot.hasTreasure;
        }
        else {
          return null;
        }
      }
    }
  }),
  interfaces: [nodeInterface]
});

const { connectionType: hidingSpotConnection } =
  connectionDefinitions({ name: 'HidingSpot', nodeType: hidingSpotType });

const checkHidingSpotForTreasureMutation = mutationWithClientMutationId({
  name: 'CheckHidingSpotForTreasure',
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLID)}
  },
  ouputFields: {
    hidingSpot: {
      type: hidingSpotType,
      resolve: ({localHidingSpot}) => getHidingSpot(localHidingSpot)
    },
    game: {
      type: gameType,
      resolve: () => getGame()
    }
  },
  mutateAndGetPayload: ({id}) => {
    let localHidingSpotId = fromGlobalId(id).id;
    CheckHidingSpotForTreasure(localHidingSpotId);
    return { localHidingSpotId };
  }
});

const queryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    node: nodeField,
    game: {
      type: gameType,
      resolve: () => getGame()
    }
  }),
});

const mutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    checkHidingSpotForTreasure: checkHidingSpotForTreasureMutation
  }),
});

export const Schema = new GraphQLSchema({
  query: queryType,
  mutation: mutationType
});
