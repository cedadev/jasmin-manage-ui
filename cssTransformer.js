// This is a custom Jest transformer module to provess files during testing with Jest.

const path = require('path')
// This library allows you to write CSS in TypeScript and integrate them with React components.
const transformer = require('@vanilla-extract/jest-transform')

module.exports = {
    process(sourceText, sourcePath, options) {
        // If this is a vanilla-extract css.ts file then pass it to the vanilla-extract transformer
        if (sourcePath.endsWith('.css.ts')) {
            // Transforms the css code according to vanilla-extract rules.
            return transformer.default.process(sourceText, sourcePath, { config: options })
        }
        // Otherwise, we just return a simple string that exports the filename because
        // we don't want any CSS being transformed in Jest.
        return {
            code: `module.exports = ${JSON.stringify(path.basename(sourcePath))};`,
        }
    },
}