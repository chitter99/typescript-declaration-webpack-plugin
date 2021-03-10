
type TypescriptDeclarationPluginOptions = {
	out: string
	removeMergedDeclarations: boolean
	removeComments: boolean
}

export default class TypescriptDeclarationPlugin {
	public readonly name = 'TypeScriptDeclarationWebpackPlugin';

	private regexImportDirective = /(\/{3} ?<reference types=")([A-Za-z0-9-]+)(" ?\/>)/;
	private regexImportModule = /import ({.+}|\*) as ([A-Za-z0-1-]+) from ('|")([A-Za-z0-1-]+)('|");/;

	options: TypescriptDeclarationPluginOptions = {
		out: 'index.d.ts',
		removeMergedDeclarations: true,
		removeComments: true
	};

	constructor(options?) {
		this.options = { ...this.options, ...options }
	}

	log(m) {
		console.log('[TypeScriptDeclarationPlugin] ' + m);
	}

	mergeDeclarations(declarationFiles) {
		let declarations = [], imports = [];

		for(let name in declarationFiles) {
			let file = declarationFiles[name].source().split('\n'), modeMultilineComment = 0;

			for(let i = 0; i < file.length; i++) {
				let line = file[i], ignoreLine = false;

				if(line.indexOf('declare') != -1 && line.indexOf('export') == -1) {
					line = 'export ' + line;
				} else if(line.indexOf('import') == 0) {
					if(line.indexOf(' as ') != -1) {
						// Module or UMD Import
						let matches = this.regexImportModule.exec(line), importTracked = false;

						// Make sure regex found matches
						// Thanks to @dario-piotrowicz
						if(matches) {
							for(let im in imports) {
								if(imports[im].mode == 'module' && imports[im].lib == matches[4] && imports[im].alias == matches[2]) {
									importTracked = true;
									break;
								}
							}
	
							if(!importTracked) {
								imports.push({
									alias: matches[2],
									lib: matches[4],
									mode: 'module'
								});
							}	
						}
					}
					ignoreLine = true;
				} else if(line.indexOf('/// ') === 0) {
					// Directive import
					let matches = this.regexImportDirective.exec(line), importTracked = false;
					
					for(let im in imports) {
						if(imports[im].mode == 'directive' && imports[im].lib == matches[2]) {
							importTracked = true;
							break;
						}
					}
					if(!importTracked) {
						imports.push({
							lib: matches[2],
							mode: 'directive'
						});
					}
					ignoreLine = true;
				} else if(line.indexOf('export') == 0 && line.indexOf('{}') != -1) {
					ignoreLine = true;
				} else if(line.startsWith('//')) {
					if(this.options.removeComments) {
						ignoreLine = true;
					}
				} else if(line.indexOf('/*') != -1) {
					if(this.options.removeComments) {
						if(line.indexOf('*/') == -1) {
							modeMultilineComment += 1;
						}
						ignoreLine = true;
					}
				} else if(line.indexOf('*/') != -1) {
					if(this.options.removeComments) {
						modeMultilineComment -= 1;
						ignoreLine = true;
					}
				}

				if(!ignoreLine) {
					declarations.push(line);
				}
			}
		}

		let declarationImports = [];
		imports.forEach(function(im) {
			switch(im.mode) {
				case 'module':
					declarationImports.push('import * as ' + im.alias + ' from "' + im.lib + '";');
					break;
				case 'directive':
					declarationImports.push('/// <reference types="' + im.lib + '" />');
					break;
			}
		});

		return declarationImports.concat(declarations).join('\n');
	}

	apply(compiler) {
		compiler.hooks.emit.tapAsync(this.name, (compilation, callback) => {
			// Search for declaration files.
			var declarationFiles = {}, foundDeclaration = false;
			for(var name in compilation.assets) {
				// Make sure declaration maps are ignored
				if(name.endsWith('.d.ts')) {
					declarationFiles[name] = compilation.assets[name];
					if(this.options.removeMergedDeclarations) {
						delete compilation.assets[name];
					}
					foundDeclaration = true;
				}
			}
			
			if(!foundDeclaration) {
				this.log('No TypeScript declarations has been found!');
				this.log('Make sure declaration are activated in tsconfig.ts!');
				return callback();
			}
			
			let mergedDeclarationFile = this.mergeDeclarations(declarationFiles);

			compilation.assets[this.options.out] = {
				source: function() {
					return mergedDeclarationFile;
				},
				size: function() {
					return mergedDeclarationFile.length;
				}
			};

			callback();
		});
	}
}
