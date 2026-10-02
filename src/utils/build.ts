// The id of this build, substituted by Vite (see vite.config.ts). 'dev' under
// the dev server, where nothing is substituted.
declare const __BUILD_ID__: string
export const BUILD_ID: string = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev'
