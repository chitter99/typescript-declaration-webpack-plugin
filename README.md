# typescript-declaration-webpack-plugin
Bundles typescript declarations generated by typescript loaded into one .d.ts file.

# What it does
The Plugin looks at all declaration files which the typescript loader generated and merges them into one.
Import will be sorted so that each module or package is only imported once.

# Setup
## Install via npm
Install this plugin via npm.

```
npm install --dev typescript-declaration-webpack-plugin
```

## tsconfig.json
Enable declaration generation by adding the following to the compiler options in your tsconfig.json file.
```json
{
  "compilerOptions": {
    "declaration": true
  }
}
```

## Webpack plugin
Add the following to your webpack.config.js file.

```javascript
const TypescriptDeclarationPlugin = require('typescript-declaration-webpack-plugin');
//...
module.exports = {
  //...
  plugins: [
    new TypescriptDeclarationPlugin({
      // Options for TypescriptDeclarationPlugin (see below)
    });
  ]
  //..
};
//...
```

## Options
There are several options how you can customize the behavior of this plugin. Just pass these options to the constructor of the TypescriptDeclarationPlugin class.

| Option                   | Descrption                                                                      | Type     |
| ------------------------ | ------------------------------------------------------------------------------- | -------- |
| out                      | Name of the bundled file. Per default `index.d.ts`                              | *string* |
| removeMergedDeclarations | If true the plugin will remove all merged declaration files. Per default `true` | *bool*   |

# Feature plan 

* Merging declaration map's generated by declarationMap compiler option
