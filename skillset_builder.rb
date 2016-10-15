#!/usr/bin/env ruby
require 'json'

def header(name)
  arrow = ' <i class="fa fa-angle-double-down" aria-hidden="true"></i> '
  "<h1 class='skillset_category_name'>#{name + arrow}</h1>"
end

def description(desc)
  "<h3 class='skillset_category_desc'>#{desc}</h3>"
end

def build_skill(title, percentage, description)
<<EOF
  <hr />
  <div class="container-fluid">
    <div class="row">
      <div class="col-md-4 skilltitle"><b>#{title}</b> [#{percentage}%]</div>
      <div class="col-md-8">
        <div class="progress">
          <div class="progress-bar progress-bar-success progress-bar-striped" role="progressbar" aria-valuenow="#{percentage}"
                                                                                                 aria-valuemin="0" aria-valuemax="100" style="width:#{percentage}%">
            <span class="sr-only">#{percentage}%</span>
          </div>
        </div>
      </div>
    </div>
    <div class="row">
      <div style="col-md-12">
      #{description}
      </div>
    </div>
  </div>
EOF
end

file = File.read('skillset.json')
hash = JSON.parse(file)
skills = hash["skills"]

puts "---
layout: page
title: Skillset
---"

skills.each do |category|
  puts header(category["name"])
  puts description(category["desc"])
  puts "<div class='skillset_list'>"
  category["skillset"].each do |skill|
    puts build_skill(
      skill["name"],
      skill["percentage"],
      skill["desc"]
    )
  end
  puts "</div>"
end
