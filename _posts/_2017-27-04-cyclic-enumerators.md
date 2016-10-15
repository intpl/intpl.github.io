---
layout: post
title: "Cyclic Enumerator in Ruby (dirty trick)"
date: 2017-04-27 21:35:00 +0200
description: Just a short blogpost about how to make a cyclic enumerator in Ruby.
share: true
---

## Iterating over an array

Let's define a simple Array and call `each` on it:

{% highlight ruby %}
enumerator = [1,2,3].each # => #<Enumerator: [1, 2, 3]:each>
{% endhighlight %}

We get an instance of `Enumerator` class. We can use the `next` method on it and if we use it more than 3 times we get a `StopIteration` exception.


{% highlight irb %}
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

{% endhighlight %}

So what we can do to create a cyclic enumerator to repeat our collection?

## Metaprogramming!

We can cover our `next` method using some metaprogramming magic, like this:

{% highlight ruby %}
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
{% endhighlight %}

and the response is as expected:

{% highlight irb %}
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
{% endhighlight %}

This is a dirty trick, because `next` is a special keyword in Ruby and covering it with our own method is not a good idea.

Unfortunately, I couldn't find a way to use all of the `Enumerable` API magic with this approach. I have to dig deeper into this. :)

