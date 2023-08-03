import chai, { expect } from 'chai';
import spies from 'chai-spies';
import { describe } from 'mocha';

import { TypescriptDeclarationPlugin } from '../src';
import config from './fixture/config';
import { run } from './helper/webpack-runner';

chai.use(spies);

describe('config-webpack-plugin', () => {
    it('should be a function', () => {
        expect(typeof TypescriptDeclarationPlugin).to.eq('function');
    });

    it('should not complain when no configuration file is specified', () => {
        expect(() => new TypescriptDeclarationPlugin()).to.not.throw();
    });

    it('should invoke `apply` when webpack is compiling modules', async () => {
        const plugin = new TypescriptDeclarationPlugin(config);
        plugin.apply = chai.spy(plugin.apply);

        await run({
            entry: './test/fixture/module.ts',
            plugins: [plugin],
        });
        expect(plugin.apply).to.have.been.called();
    }).timeout(5000);
});
