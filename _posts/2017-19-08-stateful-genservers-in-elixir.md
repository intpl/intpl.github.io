---
layout: post
title: "Stateful GenServers in Elixir"
date: 2017-08-19 12:48:00 +0200
description: Fascinated by Elixir's concurrency model, I've decided to play around with the idea of having multiple processes stored in a constantly changing list, but at the same time having a common state.
share: true
---

# What is GenServer?

A GenServer is stateful process in Elixir that has a generic server behaviour defined. What that means is that we can easily spawn a server process and a messaging system is already there. GenServer provides awesome abstraction for tracing, supervising and calling functions that can run asynchronously in the background. Besides that, GenServer is structured around the idea of having a state, which we can easily manipulate by  calling/casting a function. The only difference between calling and casting is that the latter does not need us to wait for the response.

# GenServers inside a GenServer?

I really wanted to play around with this idea, so i decided to create a parent GenServer with a basic circullar buffer (non optimal one, but using some cool pattern matching, so don't bite). The idea then is that we can have a parent GenServer storing all of the children as a list. At the same time, every child can store it's randomly generated color within it's state and print a colorized number/counter that was passed to them by another processes. In the following example processes pass around a number, print it using their colors and pass it increased by 1. The passing is done using a call to the parent GenServer, which responds with process of the next child.

# Parent GenServer

Let's define a parent GenServer first. It pretty much consists of two methods: `start` and `handle_call` (which is GenServer's magical function to just respond to a call that matches the pattern in the function arguments).


{% highlight elixir %}
defmodule Parent do
  use GenServer

  def start(quantity) do
    processes = Enum.map(1..quantity, fn _ ->
      { :ok, pid } = Child.start
      pid
    end)

    { :ok, parent_pid } = GenServer.start_link(__MODULE__, processes)
    first_pid = GenServer.call(parent_pid, :pop_and_push)
    GenServer.cast(first_pid, { :ping, 0, parent_pid })
  end

  def handle_call(:pop_and_push, _from, [head | tail]) do
    { :reply, head, tail ++ [head] }
  end
end
{% endhighlight %}

Starting a server is done by executing the `start` function with a quantity parameter that describes how many child processes we want to be spawned for this Parent. After that it stores every child's process id in it's state. After that it pings the first child and the infinite loop begins to run.
At this point I'd like to say that the handle_call for `:pop_and_push` message is nothing but just a simple function taking a list as it's last argument and returning a similar one but with the first element put at the end. Therefore calling it will return first element, but save a modified array to the state. Look at the last line: `{:reply, head, state}` - it indicates that `head` will be returned to the caller, but `state` saved as current Parent's state.
It may look scary at first sight, because of list destructuring that is done in it's argument list. Yes, in Elixir you can split a list into it's first element and the remaining elements list. It's very fast in general because of how lists (as a data structure in general) work. Every element in a list has a reference to the next one. Therefore it is done blazingly fast, in contrast to the appending an element to the end that I'm doing later on (which, unfortunately, is not that super fast, because computer has to go over every element in the list to find out which one is last - theoretically speaking).

But let's get back to the code.

# Child GenServer

{% highlight elixir %}
defmodule Child do
  use GenServer

  def start() do
    GenServer.start_link(__MODULE__, Enum.random(1..256))
  end

  def handle_cast({ :ping, number, parent_pid }, color) do
    :timer.sleep(100)

    printNumber(number, color)
    another_pid = GenServer.call(parent_pid, :pop_and_push)
    GenServer.cast(another_pid, { :ping, number + 1, parent_pid })

    { :noreply, color }
  end

  defp printNumber(number, color) do
    # ... print the number
  end
end
{% endhighlight %}

When a Child process is created, a `start()` function is called. Inside of it it generates a random color to be stored inside it's state. Keep in mind that it has to be returned from `handle_cast` (or `handle_call`) to keep it in the state. This is functional programming. Everything has to be as 'pure' as it can be. After calling `expressNumer` (which does some really cool number printing that i will show you at the end) we are calling `pop_and_push` function to bring us next process id. The `pop_and_push` function can be changed to whatever we like (e.g. returning randomly selected process id or least stressed one). After that we are calling it with a handle to match the function definition (:ping), the incremented number and a parent process pid.

# Final code

{% highlight elixir %}
require Integer

defmodule Child do
  use GenServer

  def start() do
    GenServer.start_link(__MODULE__, Enum.random(1..256))
  end

  def handle_cast({ :ping, number, parent_pid }, color) do
    :timer.sleep(100)

    printNumber(number, color)
    another_pid = GenServer.call(parent_pid, :pop_and_push)
    GenServer.cast(another_pid, { :ping, number + 1, parent_pid })

    { :noreply, color }
  end

  defp printNumber(number, color) do
    IO.puts "#{something_cool(number, color)} from #{inspect(self())} :: #{number}"
  end

  defp something_cool(number, color) do
    digits = Integer.digits(number)
    second_last = Enum.at(digits, -2) || 0
    last = List.last(digits)

    if Integer.is_odd(second_last) do
      case last do
        0 -> "\e[38;5;#{color}mʘ‿ʘ\e[0m---------"
        1 -> "-\e[38;5;#{color}mʘ‿ʘ\e[0m--------"
        2 -> "--\e[38;5;#{color}mʘ‿ʘ\e[0m-------"
        3 -> "---\e[38;5;#{color}mʘ‿ʘ\e[0m------"
        4 -> "----\e[38;5;#{color}mʘ‿ʘ\e[0m-----"
        5 -> "-----\e[38;5;#{color}mʘ‿ʘ\e[0m----"
        6 -> "------\e[38;5;#{color}mʘ‿ʘ\e[0m---"
        7 -> "-------\e[38;5;#{color}mʘ‿ʘ\e[0m--"
        8 -> "--------\e[38;5;#{color}mʘ‿ʘ\e[0m-"
        9 -> "---------\e[38;5;#{color}mʘ‿ʘ\e[0m"
      end
    else
      case last do
        0 -> "---------\e[38;5;#{color}mʘ‿ʘ\e[0m"
        1 -> "--------\e[38;5;#{color}mʘ‿ʘ\e[0m-"
        2 -> "-------\e[38;5;#{color}mʘ‿ʘ\e[0m--"
        3 -> "------\e[38;5;#{color}mʘ‿ʘ\e[0m---"
        4 -> "-----\e[38;5;#{color}mʘ‿ʘ\e[0m----"
        5 -> "----\e[38;5;#{color}mʘ‿ʘ\e[0m-----"
        6 -> "---\e[38;5;#{color}mʘ‿ʘ\e[0m------"
        7 -> "--\e[38;5;#{color}mʘ‿ʘ\e[0m-------"
        8 -> "-\e[38;5;#{color}mʘ‿ʘ\e[0m--------"
        9 -> "\e[38;5;#{color}mʘ‿ʘ\e[0m---------"
      end
    end
  end
end

defmodule Parent do
  use GenServer

  def start(quantity) do
    processes = Enum.map(1..quantity, fn _ ->
      { :ok, pid } = Child.start
      pid
    end)

    { :ok, parent_pid } = GenServer.start_link(__MODULE__, processes)
    first_pid = GenServer.call(parent_pid, :pop_and_push)
    GenServer.cast(first_pid, { :ping, 0, parent_pid })
  end

  def handle_call(:pop_and_push, _from, [head | tail]) do
    { :reply, head, tail ++ [head] }
  end
end

Parent.start(5)
:timer.sleep(1000)
Parent.start(5)
:timer.sleep(:infinity)
{% endhighlight %}

Go ahead and save it somewhere and run it with `elixir name_of_the_file.exs`. It will run forever (it will wait before each message so don't worry about that), but it will show you processes' ids and a state of the application (a counter) in every printed message. Go ahead and play around with how many processes you can pass to the `start` method (spoiler: there is a hardcoded limit of 262143 processes in the whole application, but it is because of historical/legacy reasons. You can overwrite that by running for example `elixir --erl "+P 5000000" your_file.exs` and you will be just fine. I'm passing millions easily as values to `start`. Erlang/Elixir processes are extremely light).

# Ok, but where can it get us? What is the point of all that?

GenServer is an amazing framework and a design pattern that was battle tested by Erlang throughout many years of heavy testing in money markets, business and telecom enviroment (btw. GenServer is a part of Erlang's OTP, which stands for 'Open Telecom Platform' - I find it pretty funny to be honest :D). By understanding it you get an access to a really powerful framework. Just think about. Above example could be a website parser that go through desired websites in parallel and keeps our one up-to-date. Or a weather application that collects the data from many sources and calculates the probability of a forecast based on how big differentiation there is between them. GenServer is amazing and just by knowing it you open up a door to a magical world with unicorns dancing below the mystical rainbows. GenServer. This is where the magic happens.
