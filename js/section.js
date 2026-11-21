import { formatDate, sections } from './content.js?v=4';
import { loadPosts } from './posts.js';
import { renderFooter, renderNavigation } from './site.js?v=5';

const base = '../';
const section = sections.find((item) => item.id === document.body.dataset.section);
const title = document.querySelector('[data-section-title]');
const content = document.querySelector('[data-section-content]');

renderNavigation(base, section);
renderFooter(base);
title.textContent = section.title;

if (content) {
  loadPosts(base).then(renderPosts).catch((error) => {
    console.error(error);
    content.textContent = 'Could not load the articles.';
  });
}

function renderPosts(posts) {
  const list = document.createElement('ul');
  list.className = 'post-list';

  for (const post of posts.filter((entry) => entry.sections.includes(section.id))) {
    const row = document.createElement('li');
    const link = document.createElement('a');
    link.className = 'post-link';
    link.href = `${base}${post.path}`;
    const label = document.createElement('h2');
    label.className = 'post-title';
    label.textContent = post.title;
    label.lang = post.language;
    const date = document.createElement('time');
    date.className = 'post-date';
    date.dateTime = post.date;
    date.textContent = formatDate(post.date);
    link.append(label, date);
    row.append(link);
    list.append(row);
  }
  content.append(list);
}
