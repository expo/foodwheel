'use strict';

import {
  Image,
  Linking,
  NativeModules,
  View,
} from 'react-native';
import React from 'react';

import { connect } from 'react-redux';
import Immutable from 'seamless-immutable';

import Media from './Media';
let { ExponentConstants } = NativeModules;
import REPL from './REPL';
import Styles from './Styles';

REPL.registerEval('Foodwheel', (c) => eval(c)); // eslint-disable-line no-eval


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
    let nAvel = wheel.avel * 0.5;
    if (Math.abs(nAvel) < 5) {
      nAvel = 0;
    }
    return wheel.merge({
      avel: wheel.avel + (nAvel - wheel.avel) * dt,
      rot: wheel.rot + wheel.avel * dt,
    });
  },

  TOUCH({ wheel }, { moveX, vy, move, pressed }) {
    vy = moveX < 0.5 * Styles.screenW ? -vy : vy;
    return wheel.merge({
      avel: Styles.screenW * 2 * vy,
    });
  },

  SPIN({ wheel }) {
    return wheel.merge({
      avel: 1000,
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

@connect()
class Scene extends React.Component {
  componentDidMount() {
    Linking.addEventListener('url', (event) => {
      let { url } = event;
      if (ExponentConstants.linkingUri) {
        if (url.indexOf(ExponentConstants.linkingUri) === 0) {
          let linkPath = url.substring(ExponentConstants.linkingUri.length);
          if (linkPath === 'spin') {
            this.props.dispatch({
              type: 'SPIN',
            });
          }
        }
      }
    });
  }

  render() {
    return (
      <View
        key="scene-container"
        style={[Styles.container, { backgroundColor: '#000' }]}>
        <Tabletop />
        <Wheel />
      </View>
    );
  }
}


export {
  sceneReduce,
  Scene,
};
