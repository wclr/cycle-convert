# cycle-convert

> :last_quarter_moon: Utility for converting [cycle.js](http://cycle.js.org) dataflows between stream libs.

## What?

This really very very simple. It uses `@cycle` stream lib adapters 
for converting input and output streams in passed dataflow.

```js
  import XsDataflow from './XsDataflow'  
  import xsAdapter from '@cycle/xstream-adapter'
  import rxAdapter from '@cycle/rx-adapter'
  import convert from 'cycle-convert'
  
  ...
  
  const RxDataflow = convert(XsDataflow, xsAdapter, rxAdapter)    
  // plug it in your cycle Rx app!  
```

It will (at least it should, see [cautions](#cautions)) properly convert 
all driver sources with all their (custom) methods/helpers and stuff.

You may also convert just streams:
```js    
  let rxStream$ = convert(mostStream$, mostAdapter, rxAdapter)    
```


## Why you may need it?

Well, for example if you want to migrate incrementally 
from `rxjs` to `xstream` (or maybe **visa versa?**, don't tell @staltz)

Or you may use some cyclic component created with one stream library 
inside your other component created using another lib. It is simple.

## Cautions

`cycle-convert` supports traversal of streams - this means it can
also convert nested streams *hide inside*. This may be needed for some driver
sinks for example official `@cycle/DOM` driver with `transposition` option.
To enable stream traversal use `traverse` option.

```js
const RxComponent = convert(XsComponent, xsAdapter, rxAdapter, {traverseSink: ['DOM']})
// drop it to your cycle Rx app!
```

## Install
```bash
npm install cycle-convert -S
```

## Licence

WTF?