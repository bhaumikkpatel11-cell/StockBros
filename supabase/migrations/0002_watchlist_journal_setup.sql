-- Watchlist Policies
CREATE POLICY "Users can only view their own watchlist"
ON watchlist_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own watchlist"
ON watchlist_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlist"
ON watchlist_items FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own watchlist"
ON watchlist_items FOR DELETE
USING (auth.uid() = user_id);

-- Journal Policies
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS initial_stop NUMERIC;

CREATE POLICY "Users can only view their own journal"
ON journal_entries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own journal"
ON journal_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal"
ON journal_entries FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own journal"
ON journal_entries FOR DELETE
USING (auth.uid() = user_id);

GRANT ALL ON TABLE watchlist_items TO authenticated;
GRANT ALL ON TABLE journal_entries TO authenticated;
