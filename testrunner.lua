-- rerun the tests every x seconds:
_update = function ()
    if t() >= 10 then
        run()
    end
end

-- all-in-one drop-in test framework:
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
  end
  printh('✽:it_end')
 end
 printh('✽:test:'..title)
 f(desc,it)
 printh('✽:test_end')
end

