'use strict';

import { Image, Linking, View, Platform, StatusBar } from 'react-native';
import React from 'react';

import { Entypo } from '@expo/vector-icons';

import { connect } from 'react-redux';
import Expo from 'expo';
import Immutable from 'seamless-immutable';

import Media from './Media';
import Styles from './Styles';

let { Constants } = Expo;

const TWOPI = Math.PI * 2.0;

function diffAngle(a, b) {
  while (a > TWOPI) {
    a -= TWOPI;
  }
  while (b > TWOPI) {
    b -= TWOPI;
  }
  while (a < 0) {
    a += TWOPI;
  }
  while (b < 0) {
    b += TWOPI;
  }

  let diff = a - b;
  if (Math.abs(diff) <= Math.PI) {
    return diff;
  }

  while (a > Math.PI) {
    a -= TWOPI;
  }
  while (b > Math.PI) {
    b -= TWOPI;
  }
  while (a < -Math.PI) {
    a += TWOPI;
  }
  while (b < -Math.PI) {
    b += TWOPI;
  }

  return a - b;
}

/*
 * Return a reducer that runs the reducer `reductions[action]`, defaulting to
 * `reductions.DEFAULT` if not found.
 */
const defaultReducer = reductions => (state, action, ...rest) =>
  (reductions[action.type] || reductions.DEFAULT)(state, action, ...rest);

/**
 * Wheel
 */

const wheelReduce = defaultReducer({
  START() {
    const dim = 0.8 * Math.min(Styles.screenW, Styles.screenH);
    return Immutable({
      rot: 0,
      avel: 150,
      w: dim,
      h: dim,
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

  TOUCH({ wheel }, { moveX, moveY, vx, vy, move, pressed }) {
    let vCenterToTouch = {
      x: moveX - Styles.screenW * 0.5,
      y: moveY - Styles.screenH * 0.5,
    };
    let vTouchVelocity = { x: vx, y: vy };

    let angleCenterToTouch = Math.atan2(vCenterToTouch.y, vCenterToTouch.x);
    let angleTouchVelocity = Math.atan2(vTouchVelocity.y, vTouchVelocity.x);
    let magnitudeTouchVelocity = Math.sqrt(
      vTouchVelocity.x * vTouchVelocity.x + vTouchVelocity.y * vTouchVelocity.y
    );
    let distanceCenterToTouch = Math.sqrt(
      vCenterToTouch.x * vCenterToTouch.x + vCenterToTouch.y * vCenterToTouch.y
    );
    let magicalTorqueFactor =
      distanceCenterToTouch * 0.02 * (0.5 * Styles.screenW);

    if (Platform.OS === 'android') {
      // cool velocity, android
      magnitudeTouchVelocity *= 1000000;
    }

    return wheel.merge({
      avel: Math.sin(diffAngle(angleTouchVelocity, angleCenterToTouch)) *
        magnitudeTouchVelocity *
        magicalTorqueFactor,
    });
  },

  SPIN({ wheel }) {
    return wheel.merge({
      avel: 1000 + Math.random() * 100,
    });
  },

  DEFAULT({ wheel }) {
    return wheel;
  },
});

const Wheel = connect(({ wheel }) => wheel)(({ rot, w, h }) => {
  let left = 0.5 * (Styles.screenW - w);
  let top = 0.5 * (Styles.screenH - h);
  let arrowSize = 48;
  let arrowShadowSize = 1;
  let shadowColor = '#333333';
  let arrowName = 'arrow-down';
  return (
    <View>
      <Image
        key="wheel"
        style={{
          position: 'absolute',
          transform: [{ rotate: rot + 'deg' }],
          left,
          top,
          width: w,
          height: h,
          backgroundColor: 'transparent',
        }}
        source={{ uri: Media['foodwheel.png'] }}
      />
      <Entypo
        name={arrowName}
        size={arrowSize}
        color={shadowColor}
        style={{
          position: 'absolute',
          backgroundColor: 'transparent',
          left: left + w / 2 - arrowSize / 2 - arrowShadowSize / 2,
          top: top - 10 - arrowSize / 2 - arrowShadowSize / 2,
        }}
      />
      <Entypo
        name={arrowName}
        size={arrowSize}
        color={shadowColor}
        style={{
          position: 'absolute',
          backgroundColor: 'transparent',
          left: left + w / 2 - arrowSize / 2 - arrowShadowSize / 2,
          top: top - 10 - arrowSize / 2 + arrowShadowSize / 2,
        }}
      />
      <Entypo
        name={arrowName}
        size={arrowSize}
        color={shadowColor}
        style={{
          position: 'absolute',
          backgroundColor: 'transparent',
          left: left + w / 2 - arrowSize / 2 + arrowShadowSize / 2,
          top: top - 10 - arrowSize / 2 - arrowShadowSize / 2,
        }}
      />
      <Entypo
        name={arrowName}
        size={arrowSize}
        color={shadowColor}
        style={{
          position: 'absolute',
          backgroundColor: 'transparent',
          left: left + w / 2 - arrowSize / 2 + arrowShadowSize / 2,
          top: top - 10 - arrowSize / 2 + arrowShadowSize / 2,
        }}
      />

      <Entypo
        name={arrowName}
        size={arrowSize}
        color="#ffffff"
        style={{
          position: 'absolute',
          backgroundColor: 'transparent',
          left: left + w / 2 - arrowSize / 2,
          top: top - 10 - arrowSize / 2,
        }}
      />
    </View>
  );
});

/**
 * Tabletop
 */

const Tabletop = () => {
  const dim = Math.max(Styles.screenW, Styles.screenH);
  return (
    <Image
      key="tabletop"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: dim,
        height: dim,
        backgroundColor: 'transparent',
      }}
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
  constructor(props, context) {
    super(props, context);
    if (props.exp.initialUri) {
      this.handleLink(props.exp.initialUri);
    }
  }

  componentDidMount() {
    Linking.addEventListener('url', event => {
      let { url } = event;
      if (url) {
        this.handleLink(url);
      }
    });
  }

  handleLink(url) {
    if (Constants.linkingUri) {
      if (url.indexOf(Constants.linkingUri) === 0) {
        let linkPath = url.substring(Constants.linkingUri.length);
        if (linkPath === 'spin') {
          this.props.dispatch({
            type: 'SPIN',
          });
        }
      }
    }
  }

  render() {
    return (
      <View
        key="scene-container"
        style={[Styles.container, { backgroundColor: '#000' }]}>
        <StatusBar style="default" />
        <Tabletop />
        <Wheel />
      </View>
    );
  }
}

export { sceneReduce, Scene };
