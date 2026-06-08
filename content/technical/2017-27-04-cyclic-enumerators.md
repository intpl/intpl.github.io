---
title: "(outdated) Cyclic Enumerator in Ruby (dirty trick)"
date: 2017-04-27
description: Just a short blogpost about how to make a cyclic enumerator in Ruby.
---

## Iterating over an array

Let's define a simple Array and call `each` on it:

```ruby
enumerator = [1,2,3].each # => #<Enumerator: [1, 2, 3]:each>
```

We get an instance of `Enumerator` class. We can use the `next` method on it and if we use it more than 3 times we get a `StopIteration` exception.


```
irb(main):003:0> 10.times { puts enumerator.next }
1
2
3
StopIteration: iteration reached an end
        from (irb):3:in `next'
        from (irb):3:in `block in irb_binding'
        from (irb):3:in `times'
        from (irb):3
        from /home/b/.rvm/rubies/ruby-2.3.3/bin/irb:11:in `<main>'

```

So what we can do to create a cyclic enumerator to repeat our collection?

## Metaprogramming!

We can cover our `next` method using some metaprogramming magic, like this:

```ruby
enumerator = [1,2,3].each

original_next = enumerator.method(:next)
enumerator.define_singleton_method(:next) do
  begin
    original_next.call
  rescue StopIteration
    rewind
    original_next.call
  end
end

10.times { puts enumerator.next }
```

and the response is as expected:

```
1
2
3
1
2
3
1
2
3
1
```

This is a dirty trick, because `next` is a special keyword in Ruby and covering it with our own method is not a good idea.

Unfortunately, I couldn't find a way to use all of the `Enumerable` API magic with this approach. I have to dig deeper into this. :)

