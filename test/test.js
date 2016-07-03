import rxAdapter from '@cycle/rx-adapter'
import {Observable as O} from 'rx'
import xsAdapter from '@cycle/xstream-adapter'
import xs from 'xstream'
import test from 'tape'
import convert from '../lib'

test('Convert standard dataflow', (t) => {
  let xsDataflow = ({HTTP, stream$, props}, restNum, nilVal, restStream$) => {
    return {
      HTTP: xs.combine((...args) => {
        //console.log('multiply this', ...args, restNum)
        // 1 5 16 10 6 7
        return args.concat(restNum).reduce((mult, num) => mult*num)
      }, xs.of(1), HTTP, HTTP.select(2), stream$, restStream$),
      DOM: xs.of({
        a: xs.of('A'),
        nested: {
          b: xs.of('B')
        }
      })
    }
  }

  let rxDataflow = convert(xsDataflow, xsAdapter, rxAdapter, {
    traverse: ['DOM']
  })
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

  t.plan(3)

  sinks.HTTP.subscribe((x) => {
    t.is(x, 33600)
  })

  sinks.DOM.flatMap(_ => _.a).subscribe((x) => {
    t.is(x, 'A', 'DOM nested stream `a` is ok')
  })

  sinks.DOM.map(_ => _.nested).flatMap(_ => _.b).subscribe((x) => {
    t.is(x, 'B', 'DOM nested stream `b` is ok')
  })

  setTimeout(() => {
    t.end()
  })
})

test('Convert simple dataflow', (t) => {
  let xsDataflow = (input$) =>
    xs.of({
      nested: {
        b: input$
      }
    })

  let rxDataflow = convert(xsDataflow, xsAdapter, rxAdapter, {
    traverse: true
  })

  let sinks = rxDataflow(O.of('B'))

  sinks.map(_ => _.nested).flatMap(_ => _.b).subscribe((x) => {
    t.is(x, 'B', 'DOM nested stream `b` is ok')
    t.end()
  })
})

test('Convert simple dataflow and traverse source', (t) => {
  let xsDataflow = (input$) => input$.map(_ => _.nested.b.mapTo('A'))

  let rxDataflow = convert(xsDataflow, xsAdapter, rxAdapter, {
    traverseSource: true,
    traverseSink: true
  })

  var source$ = O.of({
    nested: {
      b: O.of('B')
    }
  })

  let sinks = rxDataflow(source$)

  sinks.flatMap(_ => _).subscribe((x) => {
    t.is(x, 'A', 'DOM nested stream `b` is ok')
    t.end()
  })
})