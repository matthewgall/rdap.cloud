.PHONY: deploy-all
deploy-all:
	@wrangler publish && wrangler publish --env staging && wrangler publish --env prod