import { getPosts } from '../../lib/posts';
import SearchExperience from '../../components/SearchExperience';
export const metadata = { title: '搜索' };
export default function SearchPage() { return <SearchExperience posts={getPosts()}/>; }
