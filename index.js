
function TypescriptDeclarationPlugin(options) {
    this.out = options.out || 'index.d.ts';
    this.dependencies = options.dependencies || [];
    // Regex
    this.regexImportDirective = /(\/{3} ?<reference types=")([A-Za-z0-9-]+)(" ?\/>)/;
    this.regexImportModule = /import ({.+}|\*) as ([A-Za-z0-1-]+) from ('|")([A-Za-z0-1-]+)('|");/;
}

TypescriptDeclarationPlugin.prototype.log = function(m) {
	console.log('[TypescriptDeclarationPlugin] ' + m);
};

TypescriptDeclarationPlugin.prototype.apply = function(compiler) {
    var _this = this;
    compiler.plugin('emit', function(compilation, callback) {
        // Search for declaration files.
        var declarationFiles = {}, foundDeclaration = false;
        for(var name in compilation.assets) {
            if(name.indexOf('.d.ts') != -1) {
                declarationFiles[name] = compilation.assets[name];
                delete compilation.assets[name];
				foundDeclaration = true;
            }
        }
		
		if(!foundDeclaration) {
			_this.log('No TypeScript declarations has been found!');
			_this.log('Make sure declaration are activated in tsconfig.ts!');
			return callback();
        }
        
        // Mergin files.
        var declarations = [], imports = [];
        for(var name in declarationFiles) {
            var file = declarationFiles[name].source().split('\n');
            for(var i = 0; i < file.length; i++) {
                var line = file[i];
                var ignoreLine = false;

                if(line.indexOf('declare') != -1) {
                    if(line.indexOf('export') == -1) {
                        line = 'export ' + line;
                    }
                } else if(line.indexOf('import') == 0) {
                    if(line.indexOf(' as ') != -1) {
                        // Module or UMD Import
                        var matches = _this.regexImportModule.exec(line), importTracked = false;
                        for(var im in imports) {
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
                    ignoreLine = true;
                } else if(line.indexOf('/// ') === 0) {
                    // Directive import
                    var matches = _this.regexImportDirective.exec(line), importTracked = false;
                    for(var im in imports) {
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
                } else if(line.indexOf('export') != -1 && line.indexOf('{}') != -1) {
                    ignoreLine = true;
                }

                if(!ignoreLine) {
                    declarations.push(line);
                }
            }
        }

        var declarationImports = [];
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

        // Adding final declaration file to assets.
        var declarationFile = declarationImports.concat(declarations).join('\n');
        compilation.assets[_this.out] = {
            source: function() {
                return declarationFile;
            },
            size: function() {
                return declarationFile.length;
            }
        };

        callback();
    });
};

module.exports = TypescriptDeclarationPlugin;
