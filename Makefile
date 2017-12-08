.SILENT:
.PHONY: help

## Colors
COLOR_RESET   = \033[0m
COLOR_INFO    = \033[32m
COLOR_COMMENT = \033[33m

## Load .env
include Makefile.env

## Defaults
DIR := ${CURDIR}

## Help
help:
	printf "${COLOR_COMMENT}Usage:${COLOR_RESET}\n"
	printf " make [target]\n\n"
	printf "${COLOR_COMMENT}Available targets:${COLOR_RESET}\n"
	awk '/^[a-zA-Z\-\_0-9\.@]+:/ { \
		helpMessage = match(lastLine, /^## (.*)/); \
		if (helpMessage) { \
			helpCommand = substr($$1, 0, index($$1, ":")); \
			helpMessage = substr(lastLine, RSTART + 3, RLENGTH); \
			printf " ${COLOR_INFO}%-16s${COLOR_RESET} %s\n", helpCommand, helpMessage; \
		} \
	} \
	{ lastLine = $$0 }' $(MAKEFILE_LIST)

###########
# Install #
###########

## Install application
install: .env yarn-install yarn-build yarn-serve

yarn-install: yarn.lock
ifeq ($(CYPRESS_SKIP_BINARY_INSTALL),1)
	CYPRESS_SKIP_BINARY_INSTALL=1 $(call yarn-exec, install)
else
	$(call yarn-exec, install)
endif

#########
# Build #
#########

## Build extension and test env
build:
	$(call yarn-exec, prettier)
	$(MAKE) --always-make build-extension
	$(MAKE) --always-make build-test-env

build-extension:
	rm -rf build/
	mkdir build/
	cp *.js build/
	cp *.png build/
	cp manifest.json build/
	cp popup.html build/

build-test-env: .env
	rm -rf tests/build/
	mkdir tests/build/
	cp *.js tests/build/

#############
# Reinstall #
#############

## Reinstall application
reinstall:
	rm -rf build/
	$(MAKE) --always-make install

#########
# Tests #
#########

test: build-test-env
	$(call yarn-exec, cypress)	
	$(call yarn-exec, test)	

##########
# Dev    #
##########

yarn-serve:
	$(call yarn-exec, run serve)

##########
# Macros #
##########

define yarn-exec
	yarn $(1)
endef

