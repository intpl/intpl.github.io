---
layout: post
title: "DeerStorage - a very fast self-hosted database with shareable rows/files"
date: 2021-05-16 19:14:11 +0200
description: Using Docker, docker-compose, Elixir, Phoenix Framework, Phoenix Liveview, Ecto Embedded Schemes and Let's Encrypt I created a fully self-hosted open source web application to be used by people and organizations needing a database/files storage with sharing capabilities
share: true
toc: true
---

[Source code](https://github.com/intpl/deer_storage) - Source code licensed under GNU/GPL v3
[Demo instance](https://demo.deerstorage.com) - Demo instance to click through. May be removed by the time you read this.
[Installation/introduction video (YouTube)](https://www.youtube.com/watch?v=O5EY-dpxRuE) - Me walking you through installation and basic features of the DeerStorage

In this blog post I will use the term "database". It does not, by any means, refer to the PostgreSQL database used underneath, which is used entirely for all DeerStorage "databases". "Database" is a specific term related to DeerStorage creation named "subscription" in the code. I will refer to PostgreSQL database as "PostgreSQL database" later on, when I dive into technical details.

# Installation

Follow installation instructions on the [GitHub page](https://github.com/intpl/deer_storage)

# A problem with uploading files to the Internet when you are a professional
## --- Where to store your files? How to share them with clients?
Vast majority of people, when they want to share files with others on a regular basis, use solutions like Google Drive and similar. While it is fine for files requiring just one-time-sharing-and-forgetting, it brings out problems later on, when you have a lot more files and you want to keep track of them. You also need some sort of a naming convention for quick look-up, which may be counter-intuitive to keep track of.
For example, if you are a veterinary clinic and you want to share visit summaries and recommendations to your clients, you probably use either expensive commercial software, or you try to categorize files online somehow. If you are based in a poorer country, where currency exchange rates are unfavorable, then that software may cost you half of your income. In that case you have to use cloud-based solution from software giants like Google or Microsoft, which condemns you to categorize your files manually, having to remember where you put your files and how you are doing so. This requires you to think that through and stick to it over time. Which is, without any doubt, a problem for non-technical users. Fast lookup is nearly impossible, as you have to click through directories and remember which file is responsible for what you are looking for. You probably end up with having dozens of directories with pet names, inside of which you have multiple files named like "visit-2021-04-12.odt". After some time, you start to organize your online directories, because you have multiple pets with the same name, and spend a long time renaming directories to also include owner name. Owners have their spouses, which also can contact you, so your directory name is getting longer and longer. Now all you see is dots instead of owners list. Each time they call you, you spend endless time looking up which dog they are even talking about. Not to mention that Google Drive (at the time of writing) does not display directories of found files in the list, so you click through multiple files before you find a correct one. 

So you ask your IT-experienced friend to help you out. They set up a FTP server or come upon similarly hard to use solution. You start using it. It's complex and hard and extremely easy to make a mistake. You start looking up an online solution. You search for "how to organize your files online" on Google. First result tell you:

> If your client folders are getting messy, adding file type-based subfolders is a great way to sort things out. Again, think about what kind of work you do. If it's just a few things over and over again, then a file type method of organizing folders might be right for you. Otherwise, stick to using it for subfolders

You end up using "the cloud". You didn't have a choice, right?

...right?
# An open-source solution
## --- Let's redefine a term "relational database" to broad audiences
Believe me or not, this problem was solved [decades ago](https://en.wikipedia.org/wiki/Relational_database#History). It was just never introduced to the regular user. IT professionals know exactly how to use this paradigm in underlying databases of their software. It's nearly impossible to create a web application without a relational database. After all, everything depends on each other, so let's allow users to set up their dependencies for their data online.

![alt text](/images/deer/editing_tables.png "Editing tables...")

## --- Fast lookup over your data, grouping files?
Having a user determine exactly what depends on what allow them to structure their data and create "buckets" of files and never be lost in it again. They can quickly search for either "buckets", or files. System does not read what's inside a file, so only users have the power to determine how search results work. If they want to see for example all invoices for a client, they look up the client and see all connected records. Invoices may include pet name or the pet is stored in a separate table. No matter how the file is named, it will be listed under found pet.

![alt text](/images/deer/lookup-a-dog.png "Finding pet...")

## --- Preview of files, sharing them
Assuming you created your database tables with a consist structure (or someone IT-wise helped you do so), you probably have a table named "clients" alongside with "pets" and for example "visit documents". When someone is calling you and requesting an appointment, you create a client ("John Doe"), then their pet ("Buddy"). That's it. It took you less than a minute. After a visit you look up the client (fuzzy search, so you start typing "Jo" and immediately see the result). You click "Create connected record", select "Visit documents". You upload visit summary to the "bucket" (let's call it "record" from now on) and click "share". You send them a link to it via e-mail and everything is in track.

There is a caveat to this. You need to remember to also connect the dog to this visit. Without connecting, you will not be able to find a record through this relation.

When your client clicks a link, they will see entire record that you shared to them (you can also just share a file, without showing entire record). They don't need to log-in, create accounts, or do anything. They are presented with a clean page with record data and all uploaded files. They can preview each one (if filetype is supported) or download.


![alt text](/images/deer/sharing-record-for-viewing.png "Sharing a visit recommendations...")

If a opendocument link is clicked, they will see a preview of the file allowing them to either read it online, or download it. Same behavior is supported for most common image and video formats, OpenDocument formats and PDFs use ViewerJS. Supported format list for previewing can be found in  [the code](https://github.com/intpl/deer_storage/blob/master/lib/deer_storage_web/views/deer_record_view.ex#L31).

![alt text](/images/deer/opendocument-format-preview.png "Preview in shared record...")

## --- Allowing others to send you files, connecting them to your database
What if you request your client to take their dog for an X-Ray image and you want them to send it to you later on? One way would be to ask them to send it to you via e-mail, but let's keep things in one place. After all, you want to keep your data in one place and you really don't want to look up the image later on in your mailbox. You can share your animal database record with them by clicking "Share for editing" or you can create a table named for example "Files from clients". Then, you can click "Create connected record" from within viewing "Buddy" record.

![alt text](/images/deer/creating-connected-record.png "Creating connected record...")

It's immediately connected to your dog record, so scroll down and click "Open" on it.

![alt text](/images/deer/opening-connected-record.png "Opening connected record...")

And share it enabling link receiver to edit and upload files. Copy the link to clipboard and send it to them.

![alt text](/images/deer/sharing-to-edit.png "Generate a share to edit link...")

They can upload files and insert their name, so you know exactly who send you the files.

![alt text](/images/deer/uploading-files-as-guest.png "Uploading files as a guest...")

After they upload the image, you will see it from your dog record:

![alt text](/images/deer/receiving-a-file-from-client.png "Receiving a file from a guest...")

Although it brings security concerns and probably should be limited to file count and size on link generation (which is not at the moment of writing this post - the limit is unified with database/subscription limits), it is very handy for users to just send a link and forget about the case. When the time comes, you will have your data inside the database.

## --- Importing a table from a .csv file

I wrote a simple importer for `.csv` files. It's not the most efficient one and for sure it needs comprehensive rewrite (I'd love to use [Elixir Flow](https://hexdocs.pm/flow/Flow.html) for that), but as for now, it does the job rather well for less that 20-30k rows.

If you store your data for example in an Excel spreadsheet, where you have hundreds of records and you seek a solution for scaling it up, then DeerStorage is a good one. You can export your document as a CSV file and import it using the button shown above. You will see it on your database management page (click home icon or name of your database in left-hand side of navigation bar)

![alt text](/images/deer/csv-importer.png "CSV Importer...")

After selecting a file to import, an event is triggered and entire "database" scheme is locked inside of a PostgreSQL transaction. It then parses entire collection and inserts rows as records, giving you green log messages on the right side

![alt text](/images/deer/csv-importer-results.png "CSV Importer reports...")

I set up a limit for "debounce" event in the searchbox (meaning that a search event is sent after timeout after last key press). Currently it is set to half a second if there are 5000 records or more. It can be changed easily in [the code](https://github.com/intpl/deer_storage/blob/master/lib/deer_storage_web/live/deer_records_live/socket_assigns/records.ex#L39). I probably should set a feature flag for that or dynamically set it depending on machine running. Current debounce limits work well for a small VPS server and localhost.

Having a relatively large dataset (around 5k records, which is a big set as an example for private database), you can see that it works very fast when performing a lookup. You can use fuzzy search, so each word is matched against fields. Same for filenames. I imported a sample csv file having 5000 sales records. If you look for example for snacks sold in Panama in 2010, You just write "panama snacks 2010" and you immediately see results. 

![alt text](/images/deer/fuzzy-searching-records.png "Fuzzy searching records...")

You can upload files for each, share them if you want, compare them, etc.

![alt text](/images/deer/comparing-records.png "Comparing records...")

## --- You don't have to reload anything! It's 2021!

Leveraging [Elixir/Erlang's amazing concurrency model](https://erlang.org/doc/getting_started/conc_prog.html) and equally amazing work of folks from [Phoenix LiveView](https://hexdocs.pm/phoenix_live_view/Phoenix.LiveView.html), there is no need to ever reload a page in DeerStorage. When you create, update, upload files to records or change database tables, it sends a WebSocket event with new data to all connected browser sessions. You can be sure you always see the latest data without needing to reload a page. While we are on a veterinary clinic example, this is extremely handy if you have for example a receptionist with opened client record and a doctor inside the office next door. The doctor can set up a visit recommendations and the receptionist sees it right away.

Sometimes it happens that two people may want to save different changes to the same record at the same exact moment. DeerStorage got you covered on this, as it shows you exactly what was changed and how it differs from what you are entering. There is no need to worry about overwriting changes.

![alt text](/images/deer/overwrite-attempt.png "Attempting an overwrite record...")

Similarly when you upload files in multiple browsers, each file upload is enclosed inside a PostgreSQL transaction, so there is no need to worry about loosing your files or leaving orphaned ones on your server.

## --- User management and databases administration

### --- Admin panel for managing users and databases

In DeerStorage, user can have access to many databases, and databases can be modified by multiple users that have access. Users with according permissions can invite others by entering their e-mail addresses to an invitation page. But that's not all. Certain users may have administrator capabilities. Having that, one can manage user accounts and databases. Admins can also manage database-to-user connections easily, so creating a database and connecting it is easy and handy.

![alt text](/images/deer/admin-panel.png "Viewing a user in admin panel...")

Similarly you can see all users connected to a database:

![alt text](/images/deer/admin-panel-list-subscription-users.png "Viewing a database in admin panel...")

### --- Regular users inviting others.

As a regular user of a database you don't have to be dependent on an administrator to invite others to collaborate. If you have permissions granted, there is a handy invitation controller that allow you to manage users. Clicking a permission button toggles it:

![alt text](/images/deer/managing-users-as-regular-user.png "Managing users as regular user...")

### --- Setting limits for specific databases.

When generating a `.env`, you will be asked to provide default settings for newly created databases (if you wishes to change that later - you need to recompile the phoenix app by running `docker-compose build`). From now on, every new database will be created with those defaults. If you wishes to change it per-database, you can using admin panel.

![alt text](/images/deer/changing-database-limits.png "Editing database limits...")

## --- Database templates

Just as a proof of concept I created some example templates to be used as a starting point of your database. I didn't do any market research for what is needed and those are just examples of how you can use DeerStorage. As you can see, there is something as ridiculous as Family database template having "Agreements with kids". There is a [file in the code](https://github.com/intpl/deer_storage/blob/master/lib/deer_storage/deer_tables_examples.ex) that has all examples in it. Please don't hesitate to send pull requests with some real-world examples.

![alt text](/images/deer/example-templates.png "Example database templates...")

# Diving into architecture and code of the DeerStorage
## Dockerize everything!
I wanted DeerStorage to be easy to use and easy to set-up without compromising performance. Docker uses native Linux containers, so using it has no noticeable performance slowdowns. Having the app run inside multiple containers using docker-compose, I could accomplish the followings using just one command (`docker-compose up`):
1. A database created and running
2. Let's Encrypt certificate requested and connected
3. NGNiX that keeps reloading and waiting for the certificate. Later on wrapping everything with the SSL
4. Extremely easy to start and stop the entire application
5. Easy to scale this up in the future. With little effort create new nodes for PostgreSQL, maybe later use Elixir's [hot code reloading](https://blog.appsignal.com/2018/10/16/elixir-alchemy-hot-code-reloading-in-elixir.html), running across multiple Erlang nodes, etc.

## Database inside of your database!
I know, this may be a bad idea on paper, but I believe it's efficient for small-case scenarios (no more than 100k records per table).
It works like that:
 - Subscription (that's the name of "database" scheme you can see in DeerStorage) have it's structure. It's using Ecto `embeds_many` to include many `deer_tables`:

{% highlight elixir %}
defmodule AddDeerTablesToSubscriptions do
  use Ecto.Migration

  def change do
    alter table(:subscriptions) do
      add :deer_tables, {:array, :map}, default: []
    end
  end
end
{% endhighlight %}

{% highlight elixir %}
defmodule Subscription do
  schema "subscriptions" do
    # ...
    embeds_many :deer_tables, DeerTable, on_replace: :delete
  end
end
{% endhighlight %}

- DeerTable is very simple. It has name, uuid and a embedded schema of many `deer_columns`:

{% highlight elixir %}
defmodule DeerTable do
  embedded_schema do
    field :name, :string
    embeds_many :deer_columns, DeerColumn, on_replace: :delete
  end
end
{% endhighlight %}

- DeerColumn is even simpler, it has just a name and uuid:

{% highlight elixir %}
defmodule DeerColumn do
  embedded_schema do
    field :name, :string
  end
end
{% endhighlight %}

That pretty much defines what a database scheme inside of DeerStorage is. From now on, "database" consistency will be handled with validation functions and callbacks.
There is also a DeerRecord, which is a basically two maps. One is `deer_fields` and second is `deer_files`. Both are handled in a similar way that subscription's `deer_tables`, so callbacks are triggered and consistency with subscription tables is checked on record creation and editing.

{% highlight elixir %}
defmodule CreateDeerRecords do
  use Ecto.Migration

  def change do
    create table(:deer_records) do
      # ...
      belongs_to :subscription, Subscription
      field :deer_table_id, :string
      field :notes, :string

      add :deer_fields, {:array, :map}, default: []
      add :deer_files, {:array, :map}, default: []
      # ...
    end
  end
end
{% endhighlight %}

DeerRecords have indexes on `deer_table_id` and for `subscription_id`. Hence deer records are fast to lookup, even when total rows inside of PostgreSQL database are high. They are, after all, isolated and kept fast thanks to indexes.

I decided not to store files inside of a PostgreSQL database. Instead I use a big service job to put it to the filesystem (Docker's `uploaded_files` volume) under proper directory structure.
Hence all files are stored in the following fashion:
```
File.cwd! <> /uploaded_files/#{subscription_id}/#{table_id}/#{record_id}/#{random_uuid}
```
So, each time a user is sending a file, it triggers [DeerStorage.Services.UploadDeerFile](https://github.com/intpl/deer_storage/blob/master/lib/deer_storage/services/upload_deer_file.ex) service to spawn in the background and double check limits, move file around from temporary directory (it needs to be there as Phoenix LiveView remove files when `consume_uploaded_entries` function finishes) and assign it to deer_record inside of a PostgreSQL transaction. Yes. I know. It brings problems when someone stops Phoenix when the service is running. On the other hand, it's rather quick operation as it resides on the same filesystem and the only thing operating system must do is change the [inode](https://en.wikipedia.org/wiki/Inode)

## Elixir, Phoenix Framework, Phoenix LiveView
### Initializing DeerStorage
It is funny how [DeerStorage starts](https://github.com/intpl/deer_storage/blob/master/lib/deer_cache/supervisor.ex). It triggers multiple workers to prepare a cached data inside multiple [ETS tables](https://elixir-lang.org/getting-started/mix-otp/ets.html), divided per subscription and/or `deer_table_id` ([1](https://github.com/intpl/deer_storage/blob/master/lib/deer_cache/records_counts_cache.ex), [2](https://github.com/intpl/deer_storage/blob/master/lib/deer_cache/subscription_storage_cache.ex)). Mostly subscription files count and records count. Later on, it updates both cache systems on each database insert/deletion. Similar situation happens with file uploads/deletion. That way I could easily keep track of subscription limitations without sacrificing overall speed (did I mention that DeerStorage was supposed to be a commercial project?). ETS is extremely fast, so no need to worry about disabling both cached counts. It's also race-condition safe, due to Erlang concurrency model.
#### RecordsCountCache
All it does is run initial PostgreSQL query and then awaits for messages to increment/decrement values.

{% highlight elixir %}
  def count_records_grouped_by_deer_table_id do
    Repo.all(
      from r in DeerRecord,
      group_by: r.deer_table_id,
      select: %{deer_table_id: r.deer_table_id, count: count(r.id)}
    )
  end
{% endhighlight %}

#### SubscriptionStorageCache
Similarly, but this time command resides inside of a service object called `CalculateDeerStorage`:

{% highlight elixir %}
  def run! do
    minimal_records = Repo.all(
      from r in DeerRecord,
      select: [:subscription_id, :deer_files],
      where: fragment("cardinality(?) > 0", field(r, :deer_files))
    )

    Enum.reduce(minimal_records, %{}, fn dr, acc_map ->
      {total_files, total_kilobytes} = acc_map[dr.subscription_id] || {0, 0}
      {dr_files, dr_kilobytes} = deer_files_stats(dr)

      Map.merge(acc_map, %{dr.subscription_id => {total_files + dr_files, total_kilobytes + dr_kilobytes}})
    end)
  end
{% endhighlight %}

Yes. Startup will be slow if you have millions of files. Probably the application will break. Needs testing, but...

... is it really a concern? Keep in mind the veterinary clinic.

### Phoenix LiveView
Now that's a gem. I really love it. Basically LiveView keeps track of your state and if it changes, it automatically sends proper diffs to the browser using WebSockets.

Inside DeerStorage, each `deer_table` is really using the same file, but with different `table_id` (got from url params). The file is called [DeerRecordsLive.Index](https://github.com/intpl/deer_storage/blob/master/lib/deer_storage_web/live/deer_records_live/index.ex). The file handles A LOT of computation, so I split it into 10 modules: `Index`, `Helpers` and 8 `SocketAssigns`.
`Index` imports the `SocketAssigns` reducer functions, some of which use common code that resides in `Helpers`:

{% highlight elixir %}
defmodule Index do
  # ...
  import DeerStorageWeb.DeerRecordsLive.Index.SocketAssigns.{
    Subscription,
    EditingRecord,
    NewRecord,
    NewConnectedRecord,
    Records,
    OpenedRecords,
    ConnectingRecords,
    UploadingFiles
  }
  # ...
end
{% endhighlight %}

There is a function called `assign_initial_data/3`, which sets empty page when it mounts, and then, after receiving a `table_id` from params, the page is adjusted with data using `handle_params/3`

{% highlight elixir %}
  def handle_params(%{"table_id" => table_id} = params, _, %{assigns: %{current_user: user, current_subscription_id: subscription_id}} = socket) do
    case connected?(socket) do
      true ->
        subscribe_to_deer_channels(subscription_id, table_id)

        {:noreply,
         socket
         |> assign_subscription_if_available_subscription_link_exists!(user.id, subscription_id)
         |> assign_table_or_redirect_to_dashboard!(table_id)
         |> maybe_assign_first_search_query(prepare_search_query(params["query"]))
         |> assign_opened_record_from_params(params["id"])
        }
      false -> {:noreply, socket |> assign(query: "", records: [], count: 0)}
    end
  end
{% endhighlight %}

## Searching...
While searching for databases and users inside Admin Panel (non-live) is [my little recursion masterpiece](https://github.com/intpl/deer_storage/blob/master/lib/deer_storage/db_helpers/compose_search_query.ex), search function for `deer_records` unfortunately must have been reduced, as PostgreSQL already have a possibility to match agains any of the JSON(b) fields. `recursive_dynamic_query` gets list of words and combines it into query using Ecto [dynamic queries](https://hexdocs.pm/ecto/dynamic-queries.html)

{% highlight elixir %}
  defp recursive_dynamic_query([head| []]), do: dynamic(^recursive_dynamic_query(head))
  defp recursive_dynamic_query([head | tail]), do: dynamic(^recursive_dynamic_query(head) and ^recursive_dynamic_query(tail))
  defp recursive_dynamic_query(word) do
    word = "%#{word}%"

    matched_fields = dynamic([q], fragment("exists (select * from unnest(?) obj where obj->>'content' ilike ?)", field(q, :deer_fields), ^word))
    matched_files = dynamic([q], fragment("exists (select * from unnest(?) obj where obj->>'original_filename' ilike ?)", field(q, :deer_files), ^word))

    dynamic(^matched_fields or ^matched_files)
  end
{% endhighlight %}

That way we have native PostgreSQL query built in microseconds and we allow PostgreSQL do what it does best - find our data.

## Opening records
When opening a record, a `assign_opened_record_and_fetch_connected_records/2` is called which opens a requested record in layout. Then, the list of connected records are checked and if there are any, it tries to find them in the database. If the count is not right, it checks and cleans up the orphaned records in the background. Therefore broken connections between records are not a problem for DeerStorage.

## Connecting records, creating connected record
Both callbacks are done in a PostgreSQL transaction, so if any of the records fails to update, transaction is rolled back.

{% highlight elixir %}
  def connect_records!(%DeerRecord{id: id}, %DeerRecord{id: id}, _subscription_id), do: raise("attempt to connect the same record")
  def connect_records!(
    %DeerRecord{subscription_id: subscription_id, connected_deer_records_ids: ids1} = record1,
    %DeerRecord{subscription_id: subscription_id, connected_deer_records_ids: ids2} = record2,
    subscription_id) when length(ids1) < 100 and length(ids2) < 100 do

    record1_changeset = append_id_to_connected_deer_records(record1, record2.id)
    record2_changeset = append_id_to_connected_deer_records(record2, record1.id)

    {:ok, _} = Repo.transaction(fn ->
      Repo.update!(record1_changeset) |> notify_about_record_update
      Repo.update!(record2_changeset) |> notify_about_record_update
    end)
  end
{% endhighlight %}

## Already connected records are not listed
My assumption was that people will not connect thousands of records to a particular one (which would be very unhandy), so exclusion is done programatically instead of inside PostgreSQL query:

{% highlight elixir %}
live_component(
  @socket,
  DeerStorageWeb.DeerRecordsLive.Modal.ConnectRecordComponent,
  id: "connecting_component",
  subscription: @current_subscription,
  excluded_records_ids: [@connecting_record.id | @connecting_record.connected_deer_records_ids],
  # ...
)
{% endhighlight %}

...and inside the component:

{% highlight elixir %}
<%= for record <- connected_records do %>
  <%= if !Enum.member?(@excluded_records_ids, record.id) do %>
    # ...
  <% end %>
<% end %>
{% endhighlight %}

## Much more to write
There is so much I'd like to write about this project. I spent almost 1.5 year on writing it and I'd love to write as much as possible on lessons I have learned. I just need some feedback whether you want to read it. Please let me know if it's interesting enough to read more. And tell me what exactly would be most interesting to read.

## Let's Encrypt!
Oh and one more thing I am proud of. Managing Let's Encrypt to be fetched automatically and Nginx reloaded as soon as a certificate is fetched. This is handled using two scripts. One is a entrypoint in `certbot` Docker image, another one I put inside `/docker-entrypoint.d` of nginx Docker container (that's how it's run when nginx starts). Both containers share `config_and_certificates` volume, so as soon Certbot fetches one, Nginx gets reloaded
- Certbot entrypoint is to be found here: [certbot-entrypoint.sh](https://github.com/intpl/deer_storage/blob/master/docker-data/certbot-entrypoint.sh) - this is a modified version of [this script](https://github.com/wmnnd/nginx-certbot/blob/master/init-letsencrypt.sh)
- [nginx-proxy-reloading-script.sh](https://github.com/intpl/deer_storage/blob/master/docker-data/nginx-proxy-reloading-script.sh) I wrote on my own. That ampersand at the end took me ages to figure out.

Using both scripts we are able to initially generate a self-signed certificate (and leave it there and exit if we are not using Let's Encrypt) and make Nginx wait for it (actually: crash and restart). After finding self-signed one, it starts and waits for Let's Encrypt. As soon as it is found, it restarts and keep restarting every 6h

## Mailing support?
Yes. You can have full mailing support using MailGun. The only thing you have to do is fill out following feature flags inside your .env file. No need to recompile the app.
```
POW_MAILGUN_API_KEY=
POW_MAILGUN_BASE_URI=
POW_MAILGUN_DOMAIN=
```

# Future plans, TODO List

As I was writing this project for such a long time, I start to get lost in it. I need collaborators to help me out with it. There are so much tests to be written... (Yes, I abandonned writing them at some point)
Also, security against DoSing (maybe enabling some Web App Firewall in front of Nginx?). Supercharging CSV importer. Find all of the bugs (which probably are many)
