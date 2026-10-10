import { AppLayout } from '@/components/AppLayout';

const Blog = () => {
  return (
    <AppLayout>
      <div className="h-[100dvh] w-full">
        <iframe
          src="https://misorikenya.wordpress.com?ref=worldface"
          title="WorldFace Blog"
          className="w-full h-full border-0"
          loading="lazy"
        />
      </div>
    </AppLayout>
  );
};

export default Blog;
