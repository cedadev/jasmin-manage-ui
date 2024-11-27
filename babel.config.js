// We need to do this to handle modern JS and React syntax to be compatible with older envionments.
module.exports = {
    presets: [
        '@babel/preset-env',
        ['@babel/preset-react', {runtime: 'automatic'}],
    ],
};