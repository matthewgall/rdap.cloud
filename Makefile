.PHONY: deploy-all
deploy-all:
	@npx wrangler deploy && npx wrangler deploy --env staging && npx wrangler deploy --env prod