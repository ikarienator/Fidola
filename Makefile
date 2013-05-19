NODE_PATH ?= ./node_modules
JS_MINIFIER = $(NODE_PATH)/uglify-js/bin/uglifyjs
JS_BEAUTIFIER = $(NODE_PATH)/uglify-js/bin/uglifyjs -b -i 2 -nm -ns

all: fidola.js fidola.min.js

fidola.js: Makefile\
	lib/*/*.js \
	lib/*.js
	@rm -f $@
	@echo Building fidola.js ...
	@browserify lib/browser.js -o /tmp/fidola.js
	@cat LICENSE /tmp/fidola.js > fidola.js

fidola.min.js: fidola.js
	@rm -f $@
	@echo Building fidola.min.js ...
	@$(JS_MINIFIER) fidola.js > fidola.min.js

.PHONY: test cover

test: all
	@npm test

cover: all
	@npm run-script coverage
	@echo "\n\nOpen <fidola-root>/coverage/lcov-report/index.html"

clean:
	@rm -f fidola.js fidola.min.js
