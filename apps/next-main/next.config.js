const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
class LogFilesPlugin {
  constructor(contextName) {
    this.contextName = contextName;
  }
  apply(compiler) {
    compiler.hooks.compilation.tap('LogFilesPlugin', (compilation) => {
      webpack.NormalModule.getCompilationHooks(compilation).loader.tap('LogFilesPlugin', (loaderContext, module) => {
        console.log(`[${this.contextName}]:`, module.resource);
      });
    });
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    jsconfigPaths: true,
    appDir: true,
    serverComponentsExternalPackages: [
      'sharp',
      'onnxruntime-node',
      'canvas',
      'jsdom',
      '@anysphere/tiktoken-node',
      '@anysphere/tiktoken-node-darwin-arm64',
      '@anysphere/tiktoken-node-darwin-x64',
      '@anysphere/tiktoken-node-linux-arm64',
      '@anysphere/tiktoken-node-linux-x64',
      '@anysphere/tiktoken-node-win32-arm64',
      '@anysphere/tiktoken-node-win32-x64'
    ],
    instrumentationHook: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // We don't need special TypeScript config now that we're using the declaration file approach
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    // Right now it's set to: 1 hour
    maxInactiveAge: 60 * 60 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 10,
  },
  reactStrictMode: false,
  swcMinify: true,
  // These suffixes MUST be added to anything that is (1) A page or (2) An API route.
  // Otherwise, Next.js will assume it should not be a page.
  // Example API Route:
  // - WANT: /api/foo
  // - FILE: /pages/api/foo.api.ts
  // Example Page Route:
  // - WANT: /app/foo
  // - FILE: /pages/app/foo.page.tsx
  pageExtensions: ["page.tsx", 'page.ts', 'api.ts'],
  // webpack5: true,
  webpack: (config, { dev, isServer, defaultLoaders, nextRuntime }) => {
    console.log(`[NextJS Webpack] Running in ${dev ? 'development' : 'production'} mode`);

    // Disable critical path warnings
    // These are unnecessarily noisy, because they are mostly about inability to statically analyze the code.
    config.module.exprContextCritical = false;

    // config.plugins.push(
    //   new CopyPlugin({
    //     patterns: [
    //       { 
    //         from: 'clientOnly/xenova/xenovaPipelineWorker.js',
    //         to: 'static/chunks/xenovaPipelineWorker.js',
    //       }
    //     ]
    //   })
    // )

    if (!isServer) {
      // console.log('CLIENT ONLY BUILD')
      // console.log(config.resolve.alias)
      // config.resolve.fallback = {
      //   fs: false,
      //   tls: false,
      //   net: false,
      //   child_process: false,
      //   path: false,
      //   https: false,
      //   zlib: false,
      //   stream: false,
      //   crypto: false,    // Node's crypto module
      //   os: false,        // Operating system-related utilities
      //   dns: false,       // DNS lookup utilities
      //   dgram: false,     // UDP datagram sockets
      //   assert: false,    // Assert testing
      //   url: false,       // URL parsing utilities,
      //   async_hooks: false,
      //   cluster: false,   // Node's cluster module
      //   perf_hooks: false, // Performance timing utilities
      //   querystring: false, // Query string parsing (though URLSearchParams exists in browser)
      //   readline: false,  // Reading streams line by line
      //   repl: false,     // Node's REPL
      //   vm: false,       // Node's virtual machine module

      // path: false,
      // module: "empty"
      //};
      // config.resolve.alias = {
      //   ...config.resolve.alias,
      //   'sharp$': false,
      //   'onnxruntime-node$': false,
      // }
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'sharp': false,
        'onnxruntime-node': false,
        // Add tiktoken fallbacks for the client
        '@anysphere/tiktoken-node': false,
        '@anysphere/tiktoken-node-darwin-arm64': false,
        '@anysphere/tiktoken-node-darwin-x64': false,
        '@anysphere/tiktoken-node-linux-arm64': false,
        '@anysphere/tiktoken-node-linux-x64': false,
        '@anysphere/tiktoken-node-win32-arm64': false,
        '@anysphere/tiktoken-node-win32-x64': false,
      }
    }

    // Add a rule to exclude .spec.ts and .test.ts files
    config.module.rules.push({
      test: /\.(spec|test)\.tsx?$/,
      use: 'ignore-loader',
    });


    // We're in development mode - try to properly handle .priompt.tsx files

    // In development, do try to load the priompt-loader if it exists
    // But gracefully handle if it's missing
    let priomptLoaderExists = false;
    try {
      // Check if the loader exists
      require.resolve(path.resolve(__dirname, 'priompt-loader.js'));
      priomptLoaderExists = true;
    } catch (err) {
      // The loader doesn't exist, so we'll use a fallback approach
      console.warn('priompt-loader.js not found, using fallback for .priompt.tsx files');
    }

    if (priomptLoaderExists) {
      // Add special handling for .priompt.tsx files using the custom loader
      config.module.rules.push({
        test: /\.priompt\.tsx$/,
        enforce: 'pre', // Ensure this rule is applied before others
        use: [
          // Our custom loader to add JSX pragma before any babel processing
          path.resolve(__dirname, 'priompt-loader.js'),
          // Standard TypeScript/Babel processing
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: false,
              presets: ['next/babel'],
              plugins: [
                // Use the classic JSX runtime instead of automatic
                ['@babel/plugin-transform-react-jsx', {
                  pragma: 'Priompt.createElement',
                  pragmaFrag: 'Priompt.Fragment',
                  runtime: 'classic', // Explicitly set runtime to classic
                  throwIfNamespace: false
                }]
              ]
            }
          }
        ]
      });
    } else {
      // Fallback - just ignore these files in development too if the loader is missing
      config.module.rules.push({
        test: /\.priompt\.tsx$/,
        use: 'ignore-loader',
      });
    }


    // Add a debug plugin for .priompt.tsx files, but only in development mode
    if (dev && priomptLoaderExists) {
      // Add a debug plugin to log when files are processed
      config.plugins.push({
        apply: (compiler) => {
          compiler.hooks.normalModuleFactory.tap('PriomptDebugPlugin', (factory) => {
            // Log when a module is created
            factory.hooks.module.tap('PriomptDebugPlugin', (module, data) => {
              if (data.resource && data.resource.endsWith('.priompt.tsx')) {
                console.log('\x1b[36m%s\x1b[0m', `[Priompt Debug] Creating module: ${data.resource}`);
              }
            });

            // Log when loaders are applied to a module
            factory.hooks.afterResolve.tap('PriomptDebugPlugin', (resolveData) => {
              if (resolveData.createData &&
                resolveData.createData.resource &&
                resolveData.createData.resource.endsWith('.priompt.tsx')) {
                console.log('\x1b[36m%s\x1b[0m', `[Priompt Debug] Processing: ${resolveData.createData.resource}`);

                // Log the loaders applied to this file
                if (resolveData.createData.loaders && resolveData.createData.loaders.length > 0) {
                  console.log('\x1b[36m%s\x1b[0m', `[Priompt Debug] Loaders: ${JSON.stringify(resolveData.createData.loaders.map(l =>
                    typeof l === 'string' ? l : (l.loader || 'unknown')
                  ))}`);
                }
              }
              // Don't return, just modify - crucial for bailing hooks
            });
          });

          // Additional compilation hook to debug transformation issues
          compiler.hooks.compilation.tap('PriomptCompilationDebug', (compilation) => {
            compilation.hooks.succeedModule.tap('PriomptCompilationDebug', (module) => {
              if (module.resource && module.resource.endsWith('.priompt.tsx')) {
                console.log('\x1b[32m%s\x1b[0m', `[Priompt Debug] Successfully compiled: ${module.resource}`);
              }
            });

            compilation.hooks.failedModule.tap('PriomptCompilationDebug', (module) => {
              if (module.resource && module.resource.endsWith('.priompt.tsx')) {
                console.log('\x1b[31m%s\x1b[0m', `[Priompt Debug] Failed to compile: ${module.resource}`);
                console.log('\x1b[31m%s\x1b[0m', `[Priompt Debug] Error: ${module.error}`);
              }
            });
          });
        }
      });
    }

    if (isServer) {
      // Externalize problematic dependencies
      config.externals = [...(config.externals || []), {
        canvas: 'commonjs canvas',
        'canvas-prebuilt': 'commonjs canvas-prebuilt',
        jsdom: 'commonjs jsdom'
      }];

      // Add all tiktoken-node variants as externals
      const tiktokenExternals = {
        // '@anysphere/tiktoken-node': 'commonjs @anysphere/tiktoken-node',
        // '@anysphere/tiktoken-node-darwin-arm64': 'commonjs @anysphere/tiktoken-node-darwin-arm64',
        // '@anysphere/tiktoken-node-darwin-x64': 'commonjs @anysphere/tiktoken-node-darwin-x64',
        // '@anysphere/tiktoken-node-linux-arm64': 'commonjs @anysphere/tiktoken-node-linux-arm64',
        // '@anysphere/tiktoken-node-linux-x64': 'commonjs @anysphere/tiktoken-node-linux-x64',
        // '@anysphere/tiktoken-node-win32-arm64': 'commonjs @anysphere/tiktoken-node-win32-arm64',
        // '@anysphere/tiktoken-node-win32-x64': 'commonjs @anysphere/tiktoken-node-win32-x64',
        // '@anysphere/tiktoken-node-linux-arm64-gnu': 'commonjs @anysphere/tiktoken-node-linux-arm64-gnu',
        // '@anysphere/tiktoken-node-linux-x64-gnu': 'commonjs @anysphere/tiktoken-node-linux-x64-gnu',
        // '@anysphere/tiktoken-node-linux-arm64-musl': 'commonjs @anysphere/tiktoken-node-linux-arm64-musl',
        // '@anysphere/tiktoken-node-linux-x64-musl': 'commonjs @anysphere/tiktoken-node-linux-x64-musl',
        // '@anysphere/tiktoken-node-win32-arm64-msvc': 'commonjs @anysphere/tiktoken-node-win32-arm64-msvc',
        // '@anysphere/tiktoken-node-freebsd-x64': 'commonjs @anysphere/tiktoken-node-freebsd-x64',
        // '@anysphere/tiktoken-node-linux-arm-gnueabihf': 'commonjs @anysphere/tiktoken-node-linux-arm-gnueabihf',
        // '@anysphere/tiktoken-node-darwin-universal': 'commonjs @anysphere/tiktoken-node-darwin-universal',
      };

      config.externals.push(tiktokenExternals);
    }

    return config;
  },
  async redirects() {
    return [
      // {
      //   source: '/',
      //   destination: '/app/home',
      //   permanent: false 
      // },
      {
        source: '/app/home',
        destination: '/app',
        permanent: false
      },
      {
        source: '/privacy',
        destination: '/app/privacy',
        permanent: false
      },
      {
        source: '/terms',
        destination: '/app/terms',
        permanent: false,
      },
      // The common directory should never be accessed directly.
      {
        source: '/api/_common/:path*',
        destination: '/',
        permanent: true,
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: "/posthog/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/posthog/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/posthog/ingest/decide",
        destination: "https://us.i.posthog.com/decide",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
  transpilePackages: [
    '@reasonote/lib-sdk-apollo-client',
    '@reasonote/lib-utils',
    '@reasonote/lib-utils-frontend',
    '@reasonote/lib-api-sdk',
    '@reasonote/lib-ai'
  ]
}

module.exports = nextConfig;
