import rxAdapter from '@cycle/rx-adapter'
import {Observable as O} from 'rx'
import xsAdapter from '@cycle/xstream-adapter'
import xs from 'xstream'
import test from 'tape'
import convert from '../lib'

test('Convert', (t) => {
  let xsDataflow = ({HTTP, stream$, props}, restNum, nilVal, restStream$) => {
    return {
      HTTP: xs.combine((...args) => {
        //console.log('multiply this', ...args, restNum)
        // 1 5 16 10 6 7
        return args.concat(restNum).reduce((mult, num) => mult*num)
      }, xs.of(1), HTTP, HTTP.select(2), stream$, restStream$)
    }
  }

  let rxDataflow = convert(xsDataflow, xsAdapter, rxAdapter)
  let HTTP = O.of(5)
  HTTP._someValue = 8

  HTTP.select = function (x) {
    // test keeping context
    return O.of(x*this._someValue)
  }
  HTTP.pull = (request$) => {
    return O.of(1).map(request$).switch()
  }
  let stream$ = O.of(10)

  let sinks = rxDataflow({HTTP, stream$}, 7, null, O.just(6))

  sinks.HTTP.subscribe((x) => {
    console.log('x', x)
    t.is(x, 33600)
    t.end()
  })
})