module.exports = {
    entry: './websocket.js',
    output: {
        path: __dirname,
        filename: 'websocket.min.js',
        library: {
            type: 'module'
        }
    },
    experiments: {
        outputModule: true
    },
    mode: "production",
};