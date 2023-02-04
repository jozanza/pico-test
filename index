#!/usr/bin/env node
'use strict'

/**
 * Rolled my own tiny ANSI formatting lib :)
 */
const ANSI = {
  _: {
    // font style
    reset: 0,
    bold: 1,
    normal_color: 22,
    // colors
    red: 31,
    yellow: 33,
    green: 36,
    // CSI
    cursor_reset: '1d',
    display_erase: '2J'
  },
  esc: x => `\x1b[${x}${typeof x === 'number' ? 'm' : ''}`,
  code: x => ANSI._[x],
  codes () {
    return Array.prototype.slice.call(arguments)
      .map(compose(ANSI.esc, ANSI.code))
      .join('')
  },
  unesc: x =>
    (x || '') +
    ANSI.esc(ANSI._.reset) +
    ANSI.esc(ANSI._.normal_color),
  formatRaw: x => y => ANSI.unesc(x + (y || ''))
}
ANSI.format = compose(
  ANSI.formatRaw,
  ANSI.codes
)

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
    if (x[0] === '✽') concat = true
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
 * Prints values returned from reporter to stdout
 *
 * @param {Function} reporter - converts dispatched actions to printable strings
 * @param {Object}   getState - retrieves the current application state
 * @param {Function} write    - prints to stdout
 * @param {Object}   action   - the most recently dispatched action
 */
const printOutput = curry((reporter, getState, write, action) => {
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
  const format = ANSI.format
  switch (action.type) {
    case 'test':
      // payload: []
      out =
        format('cursor_reset', 'display_erase')() +
        format('bold')(`🎮  [PICO-TEST] ${_[0].toUpperCase()} `) +
        `@ ${(new Date()).toLocaleString()}`
      break
    case 'test_end':
      out = `${state.assertCount} tests complete. ${state.assertCount - state.failCount} passing.\n`
      if (!state.allPassed) out = format('bold', 'red')(`\n\n✖ ${out}`)
      else out = format('bold', 'green')(`\n\n✔ ${out}`)
      break
    case 'desc':
      // payload: [name:string]
      out = `\n\n+ ${_[0]}`
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
      if (failed) out = format('red')(out)
      else out = format('green')(out)
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
 * A classic FP compose function
 *
 * @param  {Function[]} ...fs - any number of unary functions (except the last which may receive muliple args)
 * @return {Function}           a composed function that chains all `fs` together from right to left
 */
function compose () {
  const fs = Array.prototype.slice.call(arguments)
  return function composed () {
    const args = Array.prototype.slice.call(arguments)
    let n = fs.length
    let x
    do {
      --n
      x = fs[n].apply(this, n < fs.length - 1 ? [x] : args)
    } while (n)
    return x
  }
}

/**
 *
 * Rolled a mini testing framework too to avoid dependencies :)
 *
 * @param {Function} f - test callback, receives args desc:Function, it:Function, and assert:Function
 */
function test (f) {
  const assert = require('assert')
  const clear = ANSI.format('cursor_reset', 'display_erase')
  const norm = ANSI.format('normal_color')
  const bold = ANSI.format('bold')
  const pass = ANSI.format('green')
  const fail = ANSI.format('red')
  const pend = ANSI.format('yellow')
  let passing = 0
  let pending = 0
  const desc = (s, f) => {
    console.log(norm(`\n+ ${s}`))
    f()
  }
  const it = (s, f, e) => assert.doesNotThrow(() => {
    if (!f) {
      ++pending
      return console.log(pend(`  - it ${s} (pending)`))
    }
    try {
      f()
      ++passing
      console.log(pass(`  ✔ it ${s}`))
    } catch (err) {
      console.log(fail(`  ✖ it ${s}`))
      throw err
    }
  }, e)
  console.log(clear())
  console.log(bold('Running tests...'))
  f(desc, it, assert)
  console.log(bold(`\n...done! ${passing + pending} total tests. ${passing} passing. ${pending} pending.`))
  console.log(`\nCompleted @ ${(new Date()).toLocaleString()}\n`)
}

/**
 *
 * Listens for inupt from pico-8
 *
 * @param {Object} store - an interface for managing the app state
 */
function run (store) {
  const parse = parseInput(store.dispatch)
  const write = mutateWrite(process.stdout, parse)
  const print = printOutput(reporter, store.getState, write)
  const opts = {
    input: process.stdin,
    output: process.stdout,
    terminal: true
  }
  // Write to stdout whenever the state changes
  store.subscribe(print)
  // read from stdin and write to stdout in tty mode
  require('readline').createInterface(opts)
}

/**
 *
 * CLI args
 *
 * @type {String[]}
 */
const argv = process.argv

/**
 *
 * Is running in TEST_MODE
 *
 * @type {Boolean}
 */
const TEST_MODE = !!argv.filter(x => x.toLowerCase() === 'test').length

/**
 * Do Stuff >:3
 */
if (!TEST_MODE) {
  run(
    createStore({
      title: '',
      lastRun: null,
      allPassed: true,
      done: false,
      assertCount: 0,
      failCount: 0,
      suites: []
    }, reducer)
  )
} else {
  test((desc, it, assert) => {
    desc('parseInput()', () => {
      it('should log strean data while a is not being parsed')
      it('should not stream data while a command is being parsed')
      it('should dispatch an action when command parsing is done')
    })
    desc('printOutput()', () => {
      it('should log an action')
    })
    desc('createStore()', () => {
      it('should return a store object')
    })
    desc('store', () => {
      it('should get the current state')
      it('should dispatch actions to the reducer')
      it('should add subscribers')
      it('should remove subscribers')
    })
    desc('mutateWrite()', () => {
      it('should mutate stream\'s write method')
      it('should return stream\'s original write method')
    })
    desc('reducer()', () => {
      it('should handle "test" actions')
      it('should handle "test_end" actions')
      it('should handle "desc" actions')
      it('should handle "it" actions')
      it('should handle "perf" actions')
      it('should handle "perf_end" actions')
      it('should handle "assert" actions')
    })
    desc('reporter()', () => {
      it('should report on "test" actions')
      it('should report on "test_end" actions')
      it('should report on "desc" actions')
      it('should report on "it_end" actions')
    })
    desc('ANSI', () => {
      it('should escape codes')
      it('should return correct code')
      it('should return list of escaped codes')
      it('should format raw')
      it('should create a formatter function')
      it('should apply correct formatting')
    })
    desc('curry()', () => {
      it('should return a function')
      it('should call function when last arg is passed')
      it('should call function when specified num of args is passed')
      it('should return same value as non-curried version')
    })
    desc('compose()', () => {
      it('should return a function', () => {
        const v = compose(() => {}, () => {})
        assert(typeof v === 'function')
      }, TypeError)
      it('should accept multiple args', () => {
        const v = compose(x => x * 2, (x, y, z) => x + y + z)
        assert(v(1, 2, 3) === 12)
      })
      it('should return same value as non-composed version')
    })
  })
}
