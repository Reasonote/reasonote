import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { page_routes } from '@/lib/routes-config';

export default function Home() {
  return (
    <div className="flex sm:min-h-[85.5vh] min-h-[85vh] flex-col items-center justify-center text-center px-2 sm:py-8 py-12">
      <h1 className="text-3xl font-bold mb-4 sm:text-6xl">
        Reasonote Dev Docs
      </h1>
      <p className="mb-8 sm:text-xl max-w-[800px] text-muted-foreground">
        These are the docs for Reasonote.
        <br/>
        We use Aria Docs for our docs.
      </p>
      <div className="flex flex-row items-center gap-5">
        <Link
          href={`/docs${page_routes[0].href}`}
          className={buttonVariants({ className: "px-6", size: "lg" })}
        >
          Get Stared
        </Link>
        <Link
          href="/blog"
          className={buttonVariants({
            variant: "secondary",
            className: "px-6",
            size: "lg",
          })}
        >
          Read Blog
        </Link>
      </div>
    </div>
  );
}
