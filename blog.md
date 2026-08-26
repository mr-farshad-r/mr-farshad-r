---
layout: default
title: Blog
description: Practical articles about React, JavaScript, TypeScript, front-end architecture, DevOps, CI/CD, accessibility, and modern web development.
---

<div class="blog-page">

    <header class="blog-header">
        <a href="{{ '/' | relative_url }}" class="back-link">&larr; Back</a>
        <h1>Blog</h1>
        <p>Thoughts, notes, and things I learn along the way.</p>
    </header>

    <ul class="blog-list">
        {% for post in site.posts %}
        <li class="blog-item{% if post.image %} has-image{% endif %}" lang="{{ post.lang | default: site.lang | default: 'en' }}" dir="{{ post.direction | default: 'ltr' }}">
            {% if post.image %}
            <a href="{{ post.url | relative_url }}" class="blog-thumb">
                <img src="{{ post.image | relative_url }}" alt="{{ post.image_alt | default: post.title | escape }}" loading="lazy" decoding="async">
            </a>
            {% endif %}
            <div class="blog-item-content">
                <a href="{{ post.url | relative_url }}" class="blog-title">{{ post.title }}</a>
                <span class="blog-date">{% if post.date_label %}{{ post.date_label }}{% else %}{{ post.date | date: "%b %-d, %Y" }}{% endif %}</span>
                {% if post.excerpt %}
                <p class="blog-excerpt">{{ post.excerpt | strip_html | truncatewords: 20 }}</p>
                {% endif %}
            </div>
        </li>
        {% endfor %}
    </ul>

</div>
