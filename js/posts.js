export async function loadPosts(base) {
  const response = await fetch(`${base}posts.json`, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Could not load posts: ${response.status}`);
  return response.json();
}
