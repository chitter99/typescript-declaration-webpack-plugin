import { Compiler, optimize, sources } from 'webpack';

type TypescriptDeclarationPluginOptions = {
	out: string;
	removeMergedDeclarations: boolean;
	removeComments: boolean;
};

export default class TypescriptDeclarationPlugin extends optimize.ModuleConcatenationPlugin {
	public readonly name = 'TypeScriptDeclarationWebpackPlugin';

	private regexImportDirective = /(\/{3} ?<reference types=")([A-Za-z0-9-]+)(" ?\/>)/;
	private regexImportModule = /import ({.+}|\*) as ([A-Za-z0-1-]+) from ('|")([A-Za-z0-1-]+)('|");/;

	options: TypescriptDeclarationPluginOptions = {
		out: 'index.d.ts',
		removeMergedDeclarations: true,
		removeComments: true
	};

	constructor(options?: TypescriptDeclarationPluginOptions) {
		super(options);
		this.options = { ...this.options, ...options };
	}

	log(m: string) {
		console.log(`[${this.name}] ${m}`);
	}

	mergeDeclarations(declarationFiles: sources.Source[]) {
		let mergedResult = '';
		const moduleImports: { alias: string, lib: string; }[] = [];
		const directiveImports: string[] = [];

		for (let name of declarationFiles) {
			const file = name.source().toString('utf-8').split('\n');
			let multilineCommentDepth = 0;

			for (const line of file) {
				if (multilineCommentDepth > 0) {
					if (line.includes('*/')) {
						multilineCommentDepth -= 1;
					}
					if (this.options.removeComments) {
						continue;
					}
				} else {
					if (line.startsWith('import')) {
						if (line.includes(' as ')) {
							// Module or UMD Import
							const matches = this.regexImportModule.exec(line);

							// Make sure regex found matches
							// Thanks to @dario-piotrowicz
							if (matches && !moduleImports.some((i) => i.alias === matches[2] && i.lib === matches[4])) {
								moduleImports.push({ alias: matches[2], lib: matches[4] });
								mergedResult += `import * as ${matches[2]} from "${matches[4]}";\n`;
							}
						}

						continue;
					}
					if (line.startsWith('/// ')) {
						// Directive import
						const matches = this.regexImportDirective.exec(line);
						if (matches && !directiveImports.includes(matches[2])) {
							directiveImports.push(matches[2]);
							mergedResult += `/// <reference types="${matches[2]}" />\n`;
						}
						continue;
					}
					if (line.startsWith('export') && line.includes('{}')) {
						continue;
					}
					if (this.options.removeComments && line.startsWith('//')) {
						continue;
					}
				}

				if (line.includes('/*')) {
					multilineCommentDepth += 1;
				}

				if (!this.options.removeComments || multilineCommentDepth === 0) {
					mergedResult += line + '\n';
				}
			}
		}

		return mergedResult;
	}

	apply(compiler: Compiler) {
		compiler.hooks.emit.tapAsync(this.name, (compilation, callback) => {
			// Search for declaration files.
			const declarationFiles: sources.Source[] = [];
			for (var name in compilation.assets) {
				// Make sure declaration maps are ignored
				if (name.endsWith('.d.ts')) {
					declarationFiles.push(compilation.assets[name]);
					if (this.options.removeMergedDeclarations) {
						delete compilation.assets[name];
					}
				}
			}

			if (declarationFiles.length > 0) {
				const mergedDeclarationFile = this.mergeDeclarations(declarationFiles);

				compilation.assets[this.options.out] = {
					source: () => mergedDeclarationFile,
					size: () => mergedDeclarationFile.length
				} as sources.Source;
			} else {
				this.log('No TypeScript declarations have been found.');
				this.log('Make sure declarations are activated in tsconfig.json!');
			}

			callback();
		});
	}
}
