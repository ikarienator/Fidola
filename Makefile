NODE_PATH ?= ./node_modules
JS_MINIFIER = $(NODE_PATH)/uglify-js/bin/uglifyjs
JS_BEAUTIFIER = $(NODE_PATH)/uglify-js/bin/uglifyjs -b -i 2 -nm -ns

all: fast.js fast.min.js

fast.js: \
	src/start.js \
	src/sequence/KMP.js \
	src/sequence/LCS.js \
	src/sequence/LCStr.js \
	src/sequence/LIS.js \
	src/sequence/Shuffle.js \
	src/datastructure/PriorityQueue.js \
	src/datastructure/RedBlackTree.js \
	src/end.js
	@rm -f $@
	@echo Building fast.js ...
	@cat $(filter %.js,$^) | $(JS_BEAUTIFIER) > $@

fast.min.js: fast.js
	@rm -f $@
	@echo Building fast.min.js ...
	@$(JS_MINIFIER) fast.js > fast.min.js

.PHONY: test cover

test: fast.js
	@npm test

cover: fast.js
	@npm run-script coverage
	@echo "\n\nOpen <fast-root>/coverage/lcov-report/index.html"

clean:
	@rm -f fast.js fast.min.js
