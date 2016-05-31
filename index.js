#!/usr/bin/env node
'use strict'

/**
 *
 * The interface that listens to stdin
 * and prints to stdout
 *
 * @type {Object}
 */
require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
})

/**
 *
 * The immutable storage layer
 *
 * @type {Object}
 */
const store = createStore({
  title: '',
  lastRun: null,
  allPassed: true,
  done: false,
  assertCount: 0,
  failCount: 0,
  suites: []
}, reducer)

/**
 *
 * Parses a stream looking for commands,
 * triggers store dispatches, and prints
 * to the console
 *
 * @param  {Function} dispatch - dispatches actions to the store
 * @param  {Function} write    - prints to stdout
 * @return {Function}            handler for printing or dispatching actions
 */
const parseInput = curry((dispatch, write) => {
  let line = ''
  let concat = false
  return x => {
    if (x[0] === '⚡') concat = true
    if (!concat) write(x)
    else {
      line += x
      if (x === '\r\n') {
        const args = line.split(':')
        const action = {
          type: args[1].trim(),
          payload: !args[2] ? [] : args[2].split(',').map(x => {
            try {
              return JSON.parse(x)
            } catch (err) {
              return x.trim()
            }
          })
        }
        dispatch(action)
        concat = false
        line = ''
      }
    }
  }
})

/**
 *
 * The original stdout.write method
 *
 * @type {Function}
 */
const write = mutateWrite(
  process.stdout,
  parseInput(store.dispatch)
)

/**
 *
 * Prints values returned from reporter to stdout
 *
 * @param  {Object}   getState - retrieves the current application state
 * @param  {Function} write    - prints to stdout
 * @param  {Object}   action   - the most recently dispatched action
 */
const printOutput = curry((getState, write, action) => {
  const out = reporter(getState(), action)
  write(typeof out === 'string' ? out : '')
})

/**
 *
 * Contains methods for interacting with the application state
 *
 * @param  {Object}   initialState - the initial application state
 * @param  {Function} reducer      - handles action dispatches
 * @return {Object}                  a store object
 */
function createStore (initialState, reducer) {
  let state = initialState
  let subscribers = []
  return {
    getState: () => state,
    subscribe: f => {
      subscribers.push(f)
      return () => subscribers.splice(subscribers.indexOf(f), 1)
    },
    dispatch: action => {
      state = reducer(state, action)
      subscribers.forEach((f) => f(action))
    }
  }
}

/**
 *
 * Replaces the write method of a stream
 *
 * @param  {Stream}   stream - the stream to be mutated
 * @param  {Function} f      - new write method
 * @return {Function}          the original stream.write method
 */
function mutateWrite (stream, f) {
  const write = stream.write.bind(stream)
  stream.write = f(write)
  return write
}

/**
 *
 * Updates the state object based on dispatched actions
 *
 * @param  {Object} state  - the current application state
 * @param  {Object} action - the most recently dispatched action
 * @return {Object}          the next state
 */
function reducer (state, action) {
  let nextState = Object.assign({}, state)
  let _ = action.payload
  const i = nextState.suites.length - 1
  const j = !nextState.suites[i]
    ? null
    : nextState.suites[i].cases.length - 1
  switch (action.type) {
    case 'test':
      // payload: []
      nextState = {
        title: _[0],
        lastRun: Date.now(),
        allPassed: true,
        done: false,
        assertCount: 0,
        failCount: 0,
        suites: []
      }
      break
    case 'test_end':
      // payload: []
      nextState.done = true
      break
    case 'desc':
      // payload: [name:string]
      nextState.suites.push({
        name: _[0],
        cases: []
      })
      break
    case 'it':
      // payload: [name:string]
      nextState.suites[i].cases.push({
        name: _[0],
        assertions: []
      })
      break
    case 'perf':
      // payload: []
      nextState.suites[i].cases[j].started = Date.now()
      break
    case 'perf_end':
      // payload: []
      nextState.suites[i].cases[j].stopped = Date.now()
      break
    case 'assert':
      // payload: [yepnope:boolean]
      nextState.suites[i].cases[j].assertions.push(_[0])
      nextState.assertCount += 1
      if (!_[0]) {
        nextState.allPassed = false
        nextState.failCount += 1
      }
      break
    default: break
  }
  return nextState
}

/**
 *
 * Returns text to be written to stdout
 *
 * @param  {Object} state  - the current application state
 * @param  {Object} action - the most recently dispatched action
 * @return {String}          text to write to stdout
 */
function reporter (state, action) {
  let out
  let _ = action.payload
  switch (action.type) {
    case 'test':
      // payload: []
      out = (
        `\n\x1b[2d\x1b[2J\x1b[0m\x1b[1m🎮  [PICOTEST] ${_[0].toUpperCase()}\x1b[22m @ ${(new Date()).toLocaleString()}`
      )
      break
    case 'test_end':
      out = `${state.assertCount} tests complete. ${state.assertCount - state.failCount} passing.\n`
      if (!state.allPassed) out = `\n\n\x1b[31m\x1b[1m✖ ${out}\x1b[0m\x1b[22m`
      else out = `\n\n\x1b[36m\x1b[1m✔ ${out}\x1b[0m\x1b[22m`
      break
    case 'desc':
      // payload: [name:string]
      out = `\n\n\x1b[0m+ ${_[0]}`
      break
    case 'it_end':
      const test = state.suites[state.suites.length - 1]
      const kase = test.cases[test.cases.length - 1]
      // const duration = kase.stopped - kase.started
      const failed = kase.assertions.reduce((next, x) => next || !x, false)
      const fails = kase.assertions.map((passed, i) => passed
        ? ''
        : `\n    • failed assertion #${i + 1}`
      ).join('')
      out = '\n  ' + [
        (failed ? '✖' : '✔'),
        kase.name,
        ''// `(${!duration ? '<1' : duration}ms)\n`,
      ].join(' ') + fails
      if (failed) out = `\x1b[31m${out}\x1b[0m`
      else out = `\x1b[36m${out}\x1b[0m`
      break
    default: break
  }
  return out
}

/**
 *
 * A classic currying function
 *
 * @param  {Function} f              - function to be made curryable
 * @param  {Number}   [len=f.length] - number of params to curry
 * @return {Function}                  a curryable version of the original function
 */
function curry (f, len) {
  return function curryable () {
    const args = Array.prototype.slice.call(arguments)
    const arity = len || f.length
    return args.length >= arity
      ? f.apply(this, args.slice(0, arity))
      : function () {
        const _args = Array.prototype.slice.call(arguments)
        const nextArgs = args.concat(_args.length ? _args : [undefined])
        return curryable.apply(this, nextArgs)
      }
  }
}

/**
 *
 * Write to stdout whenever the state changes
 *
 */
store.subscribe(printOutput(store.getState, write))
