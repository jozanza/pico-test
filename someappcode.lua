range = function (start, finish, step)
    local sequence = {}
    for i=(start or 0), (finish or 0), (step or 1) do
        add(sequence, i)
    end
    return sequence
end

eq = function (a, b)
    for i, v in ipairs(a) do
        if not b or v ~= b[i] then
            return false
        end
    end
    for i, v in ipairs(b) do
        if not a or v ~= a[i] then
            return false
        end
    end
    return true
end

reduce = function (things, fn)
    local out = nil 
    for i, thing in ipairs(things) do
        out = fn(out, thing)
    end
    return out
end

map = function (things, convert)
    local mapped = {}
    foreach(things, function(thing)
        add(mapped, convert(thing))
    end)
    return mapped
end

msb = function (n)
    n = n or 0
    if n <= 1 then
        return n
    end
    return reduce(range(0, 15), function (acc, i)
        return acc or 
            ((2 ^ (i - 1) <= n and 2 ^ i > n)
            and i or false)
    end)
end

test("some app code", function (desc, it)
    desc('pico-8 api', function ()
        it('should pget what it pset', function ()
            pset(0, 0, 8)
            return pget(0, 0) == 8
        end)
    end)
    desc('eq', function ()
        it('should not crash', function ()
            eq()
            return true
        end)
    end)
    desc('reduce', function ()
        it('should do a sum', function ()
            return reduce(range(1, 3), function (a, b)
                return (a or 0) + b
            end) == 6
        end)
    end)
    desc('range', function ()
        it('should not crash.', function ()
            range()
            return true
        end)
        it('should return an array of contiguous numbers', function ()
            return eq(range(1, 3), {1, 2, 3})
            , eq(range(5, 10), {5, 6, 7, 8, 9, 10})
            , eq(range(0, 3), {0, 1, 2, 3})
        end)
        it('should accept different step params', function ()
            return eq(range(0, 4, 2), {0, 2, 4})
        end)
        it('should accept different start params', function ()
            return eq(range(0, 3), {0, 1, 2, 3})
            , eq(range(-1, 1), {-1, 0, 1})
        end)
    end)
    desc('msb', function ()
        it('should not crash', function ()
            msb()
            return true
        end)
        it('should get most significant bit',function ()
            return eq(map(range(0, 8), msb), {0, 1, 2, 2, 3, 3, 3, 3, 4})
            , eq(map({16, 32, 64, 128, 256, 512}, msb), {5, 6, 7, 8, 9, 10})
            , (0b1000000000 == 512 and msb(512) == 10)
        end)
    end)
end)
