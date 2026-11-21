-- CreateIndex
CREATE UNIQUE INDEX idx_subscribers_token_hash_unique
ON subscribers (unsubscribe_token_hash)
WHERE unsubscribe_token_hash IS NOT NULL;
