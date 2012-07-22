
NODE_APP_FOLDER=..

all: engine.js traits.js

engine.js: $(NODE_APP_FOLDER)/engine.js
	cp $< $@

traits.js: $(NODE_APP_FOLDER)/node_modules/traits/lib/traits.js
	cp $< $@