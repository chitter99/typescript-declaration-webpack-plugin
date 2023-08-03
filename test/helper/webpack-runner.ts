import { tmpdir } from 'os';
import { webpack, Configuration, Stats } from 'webpack';

const webpackConfig: Configuration = {
    mode: 'development',
    output: {
        path: tmpdir(),
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        configFile: '../fixture/tsconfig.json',
                    },
                },
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
};

export function run(config: Configuration, callback?: any): Promise<Stats> {
    // Merge default config
    config = { ...webpackConfig, ...config };

    // Generate random output filename
    if (!config.output?.filename) {
        if (!config.output) {
            config.output = {};
        }
        config.output.filename = Math.random().toString(36).slice(2) + '.js';
    }

    return new Promise((resolve, reject) => {
        webpack(config, (err, stats) => {
            console.log('intro');
            if (callback) {
                callback(err, stats);
            }
            if (err) {
                return reject(err);
            }
            if (!stats) {
                return reject(new Error('Stats undefied'));
            }

            const info = stats.toJson();
            if (stats.hasErrors()) {
                console.error(info.errors);
            }
            if (stats.hasWarnings()) {
                console.warn(info.warnings);
            }

            resolve(stats);
        });
    });
}
