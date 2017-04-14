'use strict';

import { AppRegistry, PanResponder, View } from 'react-native';
import React from 'react';

import { connect, Provider } from 'react-redux';
import { createStore } from 'redux';
import Expo from 'expo';
import Styles from './Styles';

// Import from a different module for a different game!
import { Scene, sceneReduce } from './Foodwheel';

/**
 * Touch
 *
 * Event handler that dispatches
 * `{ ...gestureState, type: 'TOUCH', pressed: <whether pressed> }`
 * on touch events, where `gestureState` is given as in
 * https://facebook.github.io/react-native/docs/panresponder.html. Doesn't
 * actually render anything.
 */

const Touch = connect()(({ dispatch, children, ...props }) => {
  const panGrant = (_, gestureState) =>
    dispatch({ ...gestureState, type: 'TOUCH', pressed: true });
  const panMove = (_, gestureState) =>
    dispatch({ ...gestureState, type: 'TOUCH', move: true });
  const panRelease = (_, gestureState) =>
    dispatch({ ...gestureState, type: 'TOUCH', pressed: false });
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: panGrant,
    onPanResponderMove: panMove,
    onPanResponderRelease: panRelease,
    onPanResponderTerminate: panRelease,
    onShouldBlockNativeResponder: () => false,
  });

  return (
    <View
      {...props}
      {...panResponder.panHandlers}
      style={{ ...props.style, flex: 1 }}>
      {children}
    </View>
  );
});

/**
 * Clock
 *
 * Event handler that dispatches
 * `{ type: 'TICK', dt: <seconds since last tick> }`
 * per animation frame. Doesn't actually render anything.
 */

@connect()
class Clock extends React.Component {
  componentDidMount() {
    this._requestTick();
  }

  componentWillUnmount() {
    if (this._tickRequestID) {
      cancelAnimationFrame(this._tickRequestID);
    }
  }

  _requestTick() {
    if (!this._lastTickTime) {
      this._lastTickTime = Date.now();
    }
    this._tickRequestID = requestAnimationFrame(this._tick.bind(this));
  }

  _tick() {
    this._tickRequestID = undefined;
    const currTime = Date.now();
    this.tick(Math.min(0.05, 0.001 * (currTime - this._lastTickTime)));
    this._lastTickTime = currTime;
    this._requestTick();
  }

  tick(dt) {
    this.props.dispatch({ type: 'TICK', dt });
  }

  render() {
    return null;
  }
}

/**
 * Game
 *
 * Brings together event handlers and the Scene.
 */

class Game extends React.Component {
  render() {
    return (
      <View style={Styles.container}>
        <Clock />
        <Scene {...this.props} />
        <Touch style={Styles.container} />
      </View>
    );
  }
}

/**
 * Main
 *
 * Initializes a Redux store and provides it to Game.
 */

const dispatchQueue = [];

const mainReduce = (state, action) => {
  const actions = [action].concat(dispatchQueue);
  dispatchQueue.length = 0;
  const dispatch = action => actions.push(action);
  while (actions.length > 0) {
    state = sceneReduce(state, actions.shift(), dispatch);
  }
  return state;
};

const store = createStore(mainReduce, mainReduce(undefined, { type: 'START' }));

class Main extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <Game {...this.props} />
      </Provider>
    );
  }
}

Expo.registerRootComponent(Main);
