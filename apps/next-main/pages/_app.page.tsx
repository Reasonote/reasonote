import {
  useEffect,
  useState,
} from "react";

import {AppProps} from "next/app";

import {RSNTAppLayout} from "../components/_APP/_baseLayout";

export default function MyApp({ Component, pageProps }: AppProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? (
    <RSNTAppLayout>
      {/* @ts-ignore */}
      <Component {...pageProps} />
    </RSNTAppLayout>
  ) : null;
}
