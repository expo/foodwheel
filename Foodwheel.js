'use strict';

import React, {
  Image,
  View,
} from 'react-native';

import { connect } from 'react-redux/native';
import Immutable from 'seamless-immutable';

import Media from './Media';
import Styles from './Styles';

import REPL from './REPL';

REPL.registerEval('Foodwheel', (c) => eval(c));


/*
 * Return a reducer that runs the reducer `reductions[action]`, defaulting to
 * `reductions.DEFAULT` if not found.
 */
const defaultReducer = (reductions) => (state, action, ...rest) => (
  (reductions[action.type] || reductions.DEFAULT)(state, action, ...rest)
);


/**
 * Wheel
 */

const wheelReduce = defaultReducer({
  START() {
    const dim = 0.8 * Math.min(Styles.screenW, Styles.screenH);
    return Immutable({
      rot: 0,
      avel: 150,
      w: dim, h: dim,
    });
  },

  TICK({ wheel }, { dt }) {
    let nAvel = wheel.avel + (wheel.avel < 0 ? 1200 : -1200) * dt;
    if (nAvel < 0 !== wheel.avel < 0) {
      nAvel = 0;
    }
    return wheel.merge({
      avel: nAvel,
      rot: wheel.rot + wheel.avel * dt,
    });
  },

  TOUCH({ wheel }, { moveX, vy, move, pressed }) {
    vy = moveX < 0.5 * Styles.screenW ? -vy : vy;
    return wheel.merge({
      avel: Styles.screenW * 2 * vy,
    });
  },

  DEFAULT({ wheel }) {
    return wheel;
  },
});

const Wheel = connect(
  ({ wheel }) => wheel
)(
  ({ rot, w, h }) => {
    return (
      <Image
        key="wheel"
        style={{ position: 'absolute',
                 transform: [{ rotate: rot + 'deg' }],
                 left: 0.5 * (Styles.screenW - w),
                 top: 0.5 * (Styles.screenH - h),
                 width: w, height: h,
                 backgroundColor: 'transparent' }}
        source={{ uri: Media['foodwheel.png'] }}
      />
    );
  }
);


/**
 * Tabletop
 */

const Tabletop = () => {
  const dim = Math.max(Styles.screenW, Styles.screenH);
  return (
    <Image
      key="tabletop"
      style={{ position: 'absolute',
               left: 0, top: 0,
               width: dim, height: dim,
               backgroundColor: 'transparent' }}
      source={{ uri: Media['tabletop.png'] }}
    />
  );
};


/**
 * Main
 */

const sceneReduce = (state = Immutable({}), action, dispatch) => {
  return state.merge({
    wheel: wheelReduce(state, action, dispatch),
  });
};

const Scene = () => (
  <View
    key="scene-container"
    style={[Styles.container, { backgroundColor: '#000' }]}>
    <Tabletop />
    <Wheel />
  </View>
);


export {
  sceneReduce,
  Scene,
};
