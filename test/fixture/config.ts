import { TypescriptDeclarationPluginOptions } from '../../src';

export default {
    out: 'index.d.ts',
    removeMergedDeclarations: true,
    removeComments: true,
} as TypescriptDeclarationPluginOptions;
