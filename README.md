# pico-test

<p>
  <a href="https://www.npmjs.com/package/pico-test">
    <img alt="npm version" src="https://img.shields.io/npm/v/pico-test.svg" />
  </a>
  <a href="https://travis-ci.org/jozanza/pico-test">
    <img alt="build status" src="https://travis-ci.org/jozanza/pico-test.svg" />
  </a>
  <a href="http://standardjs.com/">
    <img alt="code style"  src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg" />
  </a>
</p>

> **Note:** This project is still in its initial stages, so I'd love feedback about the API and issue reports.

### Intro

PICO-8 is great but debugging your code in this little vm can be a chore.  

If you're tired of riddling your carts with `printh`s or have given up on test-driven development, this tool should help you out.

### Installation

    npm i -g pico-test

> **Note:** you can also download it directly from the [releases section](https://github.com/jozanza/pico-test/releases)

### Usage

Copy/paste `testrunner.lua` into the cart you wish to test:

```lua
test = function (title,f)
 local desc=function(msg,f)
  printh('✽:desc:'..msg)
  f()
 end
 local it=function(msg,f)
  printh('✽:it:'..msg)
  local xs=f and {f()} or {}
  if #xs>0 then
   for i=1,#xs do
    if xs[i]==true then
     printh('✽:assert:true')
    else
     printh('✽:assert:false')
    end
   end
  else
   printh('✽:pend:pend')
  end
  printh('✽:it_end')
 end
 printh('✽:test:'..title)
 f(desc,it)
 printh('✽:test_end')
end
```

Next, be sure PICO-8 is aliased properly in your terminal. You may have to do something like the following:

    alias pico-8='/Applications/PICO-8.app/Contents/MacOS/pico8'

Last, run Pico-8 from your terminal and pipe its output to `pico-test`.

    pico-8 | pico-test

Each time your run your cart, test results will be printed to `stdout`. Now, you just have to write some tests! :)

### API

`pico-test`'s api is will be pretty familiar if you've ever used [mocha](https://mochajs.org/). There are only 3 functions to learn: `test()`, `desc()`, and `it()`

#### test(title:string, fn:function)

initiates testing, wraps around test descriptions and tests, providing the callback `fn` with two args: `desc` and `it` – the other two functions in this API.

| Type     | Param | Description |
|----------|-------|-------------|
| String   | title | title of test suite
| Function | fn    | callback to call with `desc` and `it`

#### desc(description:string, fn:function)

Describes a set of tests. This function is applied as the first argument of the callback function passed to `test`

| Type     | Param       | Description |
|----------|-------------|-------------|
| String   | description | description for tests to be run inside of param `fn`
| Function | fn          | callback to call with `desc` and `it`


#### it(message:string, fn:function)

Returns one or more boolean values representing test assertions. all returned values must be `true` or your test will fail. This function is applied as the second argument of the callback function passed to `test`

| Type     | Param   | Description |
|----------|---------|-------------|
| String   | message | message starting with "should"
| Function | fn      | callback to return assertions from


### Example

Here's what it looks like in action:

```lua
-- here's an object with methods we want to test
local math={
  gt=function(a,b) return a>b end,
  lt=function(a,b) return a<b end,
  mul=function(a,b) return a*b end,
  div=function(a,b) return a/b end
}

test('math functions', function(desc,it)
  desc('math.gt()', function()
    local gt = math.gt
    it('should return type boolean', function()
      return 'boolean' == type(gt(1,0))
    end)
    it('should give same result as > operator', function()
      return gt(1,0)
    end)
  end)

  desc('math.lt()', function()
    local lt = math.lt
    it('should return type boolean',function()
      return 'boolean' == type(lt(1,0))
    end)
    it('should give same result as < operator',function()
      return lt(1, 0) == false
    end)
  end)

  desc('math.mul()', function()
    local mul = math.mul
    it('should return type number', function()
      local a = rnd(time())
      local b = rnd(time())
      return 'number' == type(mul(a,b))
    end)
    it('should give same result as * operator', function()
      local x=rnd(time())
      return
        x*1 == mul(x,1),
        x*2 == mul(x,2),
        x*3 == mul(x,3)
   end)
  end)

  desc('math.div()', function()
    local div = math.div
    it('should return type number', function()
      local a = rnd(time())
      local b = rnd(time())
      return 'number' == type(div(a,b))
    end)
    it('should give same result as / operator', function()
      local x=1+rnd(time())
      return
        x/1 == div(x,1),
        x/2 == div(x,2),
        x/3 == div(x,3)
    end)
  end)

end)
```

### License

Copyright (c) 2015 Josiah Savary. Made available under The MIT License (MIT).
