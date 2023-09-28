import { decodeBase64, encodeBase64 } from '@/utils/common';
import OrgParser from '@/components/OrgParser';

interface PageProps {
  params: {
    post: string
  }
}

export default async function Post({params: {post}}: PageProps) {
  const relPath = decodeBase64(post);
  const parser = new OrgParser(relPath);
  const component = parser.parse();
  return (<div>{component}</div>);
}
