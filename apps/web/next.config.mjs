import createNextIntlPlugin from 'next-intl/plugin'

export const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
}

export default withNextIntl(nextConfig)
