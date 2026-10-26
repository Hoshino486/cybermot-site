import HomeExperience from '../components/HomeExperience';
import { getPosts } from '../lib/posts';
export default function Home() {
  const posts = getPosts().map(post => ({ ...post, searchText: '' }));
  return <HomeExperience posts={posts} />;
}
