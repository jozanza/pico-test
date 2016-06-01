<p align="center">
  <a href="http://badge.fury.io/js/picotest">
    <img alt="npm version" src="https://badge.fury.io/js/picotest.svg" />
  </a>
  <a href="https://travis-ci.org/jozanza/picotest">
    <img alt="build status" src="https://travis-ci.org/jozanza/picotest.svg" />
  </a>
  <a href='https://coveralls.io/github/jozanza/picotest?branch=master'>
    <img src='https://coveralls.io/repos/jozanza/picotest/badge.svg?branch=master&service=github' alt='Coverage Status' />
  </a>
</p>

# Picotest

Pico-8 is great but debugging your code in this little vm can be a chore.

If you're tired of riddling your carts with `printh`'s or have given up on test-driven development, this should help you out.

### Installation

    npm i -g picotest

It is also directly available for [download](https://...)

### Usage

 First, run Pico-8 from the command line and pipe its output to `picotest`.
 
    path/to/pico-8 | picotest
 
 **Next, copy/paste the following snippet into the cart you wish to test**:

```lua 
function test(title,f)
 local desc=function(msg,f)
  printh('⚡:desc:'..msg)
  f()
 end
 local it=function(msg,f)
  printh('⚡:it:'..msg)
  local xs={f()}
  for i=1,#xs do
   if xs[i] == true then
    printh('⚡:assert:true')
   else
    printh('⚡:assert:false')
   end
  end
  printh('⚡:it_end')
 end 
 printh('⚡:test:'..title)
 f(desc,it)
 printh('⚡:test_end')
end
```

Now, you're ready to start writing tests!

### API

`picotest`'s api is will be pretty familiar if you've ever used [mocha](https://mochajs.org/). There are only 3 functions to learn: `test()`, `desc()`, and `it()`

**test(title:String, fn:Function)**

    test title fn
      initiates testing, wraps around test descriptions and tests, providing the callback `fn` with two args: desc() and it()
      
**desc(description:String, fn:Function)**

    desc description fn
      describes a set of tests. muse be used within the scope of the callback fn passed to test()
      
**it(message:String, fn:Function)**

    it message fn
      returns one or more boolean values representing test assertions. all returned values must be `true` or your test will fail.

***example:***
```lua
-- here's an object with methods we want to test 
local math={
  gt=function(a,b) return a>b end,
  lt=function(a,b) return a<b end,
  mul=function(a,b) return a*b end,
  div=function(a,b) return a/b end
}

-- start the test by calling test() with a title and callback function
test('math functions',function(desc,it)
  -- inside the callback, use desc() to describe your tests
  desc('math.gt()',function()
    local gt = math.gt
    -- and use it() to create tests that return assertions
    -- if any value other than `true`, that test will fail
    -- your tests may return multiple assertions (check out the tests below)
    it('should return type boolean', function()
      return 'boolean' == type(gt(1,0))
    end)
    it('should give same result as > operator', function()
      return gt(1,0)
    end)
  end)
 
  desc('math.lt()',function()
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


