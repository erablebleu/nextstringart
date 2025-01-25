import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    output: 'standalone',
    experimental: {
        webpackBuildWorker: false,
    },

    // disable the development logging
    logging: false,

    webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
        if (isServer) {
            config.output.publicPath = ""
        }

        // config.externals = ['serialport']
        config.externals.push('serialport')
        return config
    },
}

export default nextConfig