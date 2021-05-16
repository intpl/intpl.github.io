---
layout: post
title: "Replace ugly looking symbol hashes with Regexp"
date: 2017-06-17 14:00:00 +0200
description: Simple oneliner to replace all old 1.8-looking hashes (:a => :b) with new notation.
share: true
toc: true
---

We've all seen this:
{% highlight ruby %}
{ :symbol => 'value' }
{% endhighlight %}

Let's replace all of these ugly-looking old symbol key-value pairs into these ones (respecting the spacing):
{% highlight ruby %}
{ symbol: 'value' }
{% endhighlight %}


So the Regexp find-and-replace command I've used in Vim is the following:
{% highlight viml %}
s/:\([a-z_]*\)\(\s*\) =>/\1:\2/g
{% endhighlight %}

Therefore we can use `sed` and pass it to `find` to replace all of our occurances in the project at once. Like this:

{% highlight bash %}
find . -name '*.rb' -print0 | xargs -0 sed -i 's/:\([a-z_]*\)\(\s*\) =>/\1:\2/g'
{% endhighlight %}
