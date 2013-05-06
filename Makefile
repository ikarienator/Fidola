NODE_PATH ?= ./node_modules
JS_MINIFIER = $(NODE_PATH)/uglify-js/bin/uglifyjs
JS_BEAUTIFIER = $(NODE_PATH)/uglify-js/bin/uglifyjs -b -i 2 -nm -ns

all: fast.js fast.min.js

fast.js: Makefile\
	lib/sequence/BinarySearch.js \
	lib/sequence/KMP.js \
	lib/sequence/LCS.js \
	lib/sequence/LCStr.js \
	lib/sequence/LIS.js \
	lib/sequence/Shuffle.js \
	lib/datastructure/BinaryHeap.js \
	lib/datastructure/BinarySearchTree.js \
	lib/datastructure/RedBlackTree.js \
	lib/numeric/FastFourierTransform.js \
	lib/numeric/CubicPolynomialSolver.js \
	lib/numbertheory/Basics.js \
	lib/numbertheory/PrimalityTest.js \
	lib/numbertheory/FNTT.js \
	lib/browser.js \
	lib/fast.js
	@rm -f $@
	@echo Building fast.js ...
	browserify lib/browser.js -o fast.js

fast.min.js: fast.js
	@rm -f $@
	@echo Building fast.min.js ...
	@$(JS_MINIFIER) fast.js > fast.min.js

.PHONY: test cover

test: all
	@npm test

cover: all
	@npm run-script coverage
	@echo "\n\nOpen <fast-root>/coverage/lcov-report/index.html"

clean:
	@rm -f fast.js fast.min.js
