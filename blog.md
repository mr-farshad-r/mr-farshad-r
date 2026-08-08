---
layout: default
title: Blog
---

<div class="blog-page">

    <header class="blog-header">
        <a href="{{ '/' | relative_url }}" class="back-link">&larr; Back</a>
        <h1>Blog</h1>
        <p>Thoughts, notes, and things I learn along the way.</p>
    </header>

    <ul class="blog-list">
        {% for post in site.posts %}
        <li class="blog-item">
            <a href="{{ post.url | relative_url }}" class="blog-title">{{ post.title }}</a>
            <span class="blog-date">{{ post.date | date: "%b %-d, %Y" }}</span>
            {% if post.excerpt %}
            <p class="blog-excerpt">{{ post.excerpt | strip_html | truncatewords: 20 }}</p>
            {% endif %}
        </li>
        {% endfor %}
    </ul>

</div>
